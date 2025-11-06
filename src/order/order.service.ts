import z from 'zod';

import { Address } from '@/address/address.model';
import { addressService } from '@/address/address.service';
import { CartItem } from '@/cart/cart-item.model';
import { sequelize } from '@/lib/config';
import { emitter } from '@/lib/events/emitter';
import { BadRequest, NotFound, UnprocessableEntity } from '@/lib/exceptions';
import { validateWithZodSchema } from '@/lib/utils';
import { PaymentAttempt } from '@/payment/payment.model';
import { Product } from '@/product/product.model';
import { Seller } from '@/seller/seller.model';

import { PlaceOrderDto } from './dto';
import { OrderItem } from './order-item.model';
import { CancellationBy, OrderItemStatus } from './order.enum';
import { OrderEvent } from './order.event';
import { Order } from './order.model';

export const orderService: OrderService = {
	placeOrder: async (userId, rawOrderData) => {
		const {
			shippingAddress: shippingAddressInput,
			items,
			cart: useCart,
		} = await validateWithZodSchema(
			PlaceOrderDto,
			rawOrderData,
			'Invalid data for placing an order',
		);

		const shippingAddressId = await addressService.resolveShippingAddress(
			userId,
			shippingAddressInput,
		);
		const orderItems = await orderService.resolveOrderItems(
			userId,
			useCart,
			items,
		);
		const { orderItemsWithDetails, total } =
			await orderService.validateAndPrepareOrderItems(orderItems);

		const order = await sequelize.transaction(async (transaction) => {
			const order = await Order.create(
				{
					userId,
					shippingAddressId,
					total,
				},
				{ transaction },
			);

			await OrderItem.bulkCreate(
				orderItemsWithDetails.map((item) => ({
					...item,
					orderId: order.id,
				})),
				{ transaction },
			);

			if (useCart) {
				await CartItem.destroy({
					where: { userId },
					transaction,
				});
			}

			return order;
		});

		emitter.emit(OrderEvent.ORDER_PLACED, userId, order);

		return Order.findByPk(order.id, {
			attributes: { exclude: ['userId'] },
			include: [
				{
					model: OrderItem,
					attributes: { exclude: ['orderId'] },
				},
				{
					model: Address,
				},
			],
		});
	},

	resolveOrderItems: async (userId, useCart, items) => {
		const orderItems: { productId: string; quantity: number }[] = [];
		if (useCart) {
			const cartItems = await CartItem.findAll({
				where: { userId },
				attributes: ['productId', 'quantity'],
			});
			orderItems.push(
				...cartItems.map((item) => ({
					productId: item.productId,
					quantity: item.quantity,
				})),
			);
		}

		orderItems.push(...(items || []));

		if (!orderItems || orderItems.length === 0) {
			throw new UnprocessableEntity('No items provided for order.');
		}
		return orderItems;
	},

	validateAndPrepareOrderItems: async (orderItems) => {
		const productIds = orderItems.map((item) => item.productId);

		const products = await Product.findAll({
			where: { id: productIds },
		});

		const productMap = new Map(products.map((p) => [p.id, p]));
		let total = 0;
		const validOrderItems: {
			productId: string;
			sellerId: string;
			productName: string;
			unitPrice: number;
			quantity: number;
		}[] = [];

		for (const item of orderItems) {
			const product = productMap.get(item.productId);

			if (!product) {
				// TODO: Inform the user about missing product
				console.warn(`Product ${item.productId} not found`);
				continue;
			}

			if (product.quantity < item.quantity) {
				// TODO: Inform the user about unavailable stocks
				console.warn(`Insufficient stock for product ${product.name}`);
				continue;
			}

			const itemTotal = product.price * item.quantity;
			total += itemTotal;

			validOrderItems.push({
				productId: product.id,
				sellerId: product.sellerId,
				productName: product.name,
				unitPrice: product.price,
				quantity: item.quantity,
			});
		}

		await sequelize.transaction(async (transaction) => {
			const updatePromises = validOrderItems.map((item) =>
				Product.decrement('quantity', {
					by: item.quantity,
					where: { id: item.productId },
					transaction,
				}),
			);
			await Promise.all(updatePromises);
		});

		return { orderItemsWithDetails: validOrderItems, total };
	},

	getAllOrders: async (userId) => {
		return Order.findAll({
			where: { userId },
			attributes: { exclude: ['userId'] },
			include: [
				{ model: OrderItem, attributes: { exclude: ['orderId'] } },
				Address,
			],
			order: [['created_at', 'DESC']],
		});
	},

	getOrder: async (userId, orderId) => {
		const order = await Order.findOne({
			where: { id: orderId, userId },
			attributes: { exclude: ['userId'] },
			include: [
				{
					model: OrderItem,
					attributes: { exclude: ['orderId'] },
					include: [{ model: Seller, attributes: ['storeName'] }],
				},
				Address,
				PaymentAttempt,
			],
		});

		if (!order) throw new NotFound('Order not found.');
		return { order, status: await orderService.getOrderStatus(order.id) };
	},

	cancelOrder: async (userId, orderId) => {
		const order = await Order.findOne({
			where: { id: orderId, userId },
			include: [
				{
					model: OrderItem,
					attributes: ['id', 'productId', 'status'],
				},
			],
		});

		if (!order) throw new NotFound('Order not found.');

		const cancellableItems = order.orderItems!.filter(
			(item) => item.status === OrderItemStatus.PENDING,
		);
		if (cancellableItems.length === 0) {
			throw new UnprocessableEntity(
				'No cancellable items found in this order.',
			);
		}

		await sequelize.transaction(async (transaction) => {
			const productIds = cancellableItems.map((item) => item.productId);
			const products = await Product.findAll({
				where: { id: productIds },
				attributes: ['id', 'quantity'],
				transaction,
			});
			const productIdToProduct = new Map(products.map((p) => [p.id, p]));

			await Promise.all([
				OrderItem.update(
					{
						status: OrderItemStatus.CANCELLED,
						cancelledBy: CancellationBy.BUYER,
					},
					{
						where: {
							id: cancellableItems.map((item) => item.id),
						},
						transaction,
					},
				),

				...cancellableItems.map((item) => {
					const product = productIdToProduct.get(item.productId);
					if (product) {
						return product.increment('quantity', {
							by: item.quantity,
							transaction,
						});
					}
					return Promise.resolve();
				}),
			]);
		});

		return Order.findByPk(orderId, { include: [OrderItem, Address] });
	},

	getOrderStatus: async (orderId) => {
		const orderItems = await OrderItem.findAll({ where: { orderId } });
		const statusCounts = orderItems.reduce(
			(acc, item) => {
				acc[item.status] = (acc[item.status] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);

		return {
			...statusCounts,
			totalItems: orderItems.length,
		};
	},

	getAllOrdersBySeller: async (userId) => {
		const seller = await Seller.findOne({
			where: { userId },
			attributes: ['id'],
		});
		if (!seller) throw new NotFound('Seller profile not found.');

		const orders = await Order.findAll({
			include: [
				{
					model: OrderItem,
					where: { sellerId: seller.id },
					include: [Product],
					required: true,
					order: [['productName', 'ASC']],
				},
				{ model: Address, as: 'shippingAddress' },
			],
			order: [['created_at', 'DESC']],
		});

		return orders.map((order) => ({
			id: order.id,
			orderNumber: order.orderNumber,
			totalAmount: order.total,
			shippingAddress: order.shippingAddress!,
			createdAt: order.createdAt,
			updatedAt: order.updatedAt,
			orderItems: order.orderItems!.map((item) => ({
				id: item.id,
				product: item.product,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				status: item.status,
				cancelledBy: item.cancelledBy,
			})),
		}));
	},

	getOrderBySeller: async (userId, orderId) => {
		const seller = await Seller.findOne({
			where: { userId },
			attributes: ['id'],
		});
		if (!seller) throw new NotFound('Seller profile not found.');

		const order = await Order.findOne({
			where: { id: orderId },
			include: [
				{
					model: OrderItem,
					where: { sellerId: seller.id },
					include: [Product],
					required: true,
					order: [['productName', 'ASC']],
				},
				{ model: Address, as: 'shippingAddress' },
			],
			order: [['created_at', 'DESC']],
		});

		if (!order) {
			throw new NotFound('Order not found');
		}

		if (!order.orderItems || order.orderItems.length === 0) {
			throw new NotFound('No order items found');
		}

		return {
			id: order.id,
			orderNumber: order.orderNumber,
			totalAmount: order.total,
			shippingAddress: order.shippingAddress!,
			createdAt: order.createdAt,
			updatedAt: order.updatedAt,
			orderItems: order.orderItems.map((item) => ({
				id: item.id,
				product: item.product,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				status: item.status,
				cancelledBy: item.cancelledBy,
			})),
		};
	},

	updateOrderStatusBySeller: async (userId, orderId, itemId, rawStatusData) => {
		const { status } = await validateWithZodSchema(
			z.object({ status: z.enum(Object.values(OrderItemStatus)) }),
			rawStatusData,
			'Invalid status data',
		);

		const seller = await Seller.findOne({
			where: { userId },
			attributes: ['id'],
		});
		if (!seller) throw new NotFound('Seller profile not found.');

		const orderItem = await OrderItem.findOne({
			where: { id: itemId, orderId, sellerId: seller.id },
		});
		if (!orderItem)
			throw new NotFound('Order item not found or access denied.');

		if (
			orderItem.status === OrderItemStatus.DELIVERED &&
			status !== OrderItemStatus.DELIVERED
		) {
			throw new BadRequest('Cannot change status of delivered item.');
		}
		if (
			orderItem.status === OrderItemStatus.CANCELLED &&
			status !== OrderItemStatus.CANCELLED
		) {
			throw new BadRequest('Cannot change status of cancelled item.');
		}

		await orderItem.update({ status });
		return orderItem;
	},
};

interface OrderService {
	placeOrder: (
		userId: string,
		rawOrderData: any,
		useCart?: boolean,
	) => Promise<Order | null>;
	resolveOrderItems: (
		userId: string,
		useCart: boolean,
		items: { productId: string; quantity: number }[] | undefined,
	) => Promise<Array<{ productId: string; quantity: number }>>;
	validateAndPrepareOrderItems: (
		orderItems: Array<{ productId: string; quantity: number }>,
	) => Promise<{
		orderItemsWithDetails: Array<{
			productId: string;
			sellerId: string;
			productName: string;
			unitPrice: number;
			quantity: number;
		}>;
		total: number;
	}>;
	getAllOrders: (userId: string) => Promise<Order[]>;
	getOrder: (
		userId: string,
		orderId: string,
	) => Promise<{
		order: Order;
		status: OrderStatus;
	}>;
	cancelOrder: (userId: string, orderId: string) => Promise<Order | null>;
	getOrderStatus: (orderId: string) => Promise<OrderStatus>;
	getAllOrdersBySeller: (userId: string) => Promise<
		Array<{
			id: string;
			orderNumber: string;
			totalAmount: number;
			createdAt: Date;
			updatedAt: Date;
			shippingAddress: Address;
			orderItems: Array<{
				id: string;
				product: Product | undefined | null;
				quantity: number;
				unitPrice: number;
				status: OrderItemStatus;
				cancelledBy: CancellationBy;
			}>;
		}>
	>;
	getOrderBySeller: (
		userId: string,
		orderId: string,
	) => Promise<{
		id: string;
		orderNumber: string;
		totalAmount: number;
		createdAt: Date;
		updatedAt: Date;
		shippingAddress: Address;
		orderItems: Array<{
			id: string;
			product: Product | undefined | null;
			quantity: number;
			unitPrice: number;
			status: OrderItemStatus;
			cancelledBy: CancellationBy;
		}>;
	}>;
	updateOrderStatusBySeller: (
		userId: string,
		orderId: string,
		itemId: string,
		rawStatusData: any,
	) => Promise<OrderItem>;
}
type OrderStatus = Record<OrderItemStatus, number> | { totalItems: number };
