import { Address } from '@/address/address.model';
import { addressService } from '@/address/address.service';
import { CartItem } from '@/cart/cart-item.model';
import { sequelize } from '@/lib/config';
import { NotFound, UnprocessableEntity } from '@/lib/exceptions';
import { validateWithZodSchema } from '@/lib/utils';
import { PaymentAttempt } from '@/payment/payment.model';
import { Product } from '@/product/product.model';
import { Seller } from '@/seller/seller.model';

import { PlaceOrderDto } from './dto';
import { OrderItem } from './order-item.model';
import { CancellationBy, OrderItemStatus } from './order.enum';
import { Order } from './order.model';

export const orderService: OrderService = {
	placeOrder: async (userId, rawOrderData, useCart = false) => {
		const { shippingAddress: shippingAddressInput, items: directItems } =
			await validateWithZodSchema(
				PlaceOrderDto,
				rawOrderData,
				'Invalid order data',
			);

		const shippingAddressId = await addressService.resolveShippingAddress(
			userId,
			shippingAddressInput,
		);
		const orderItems = await orderService.resolveOrderItems(
			userId,
			useCart,
			directItems,
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

		return Order.findByPk(order.id, {
			include: [OrderItem, Address],
		});
	},

	resolveShippingAddress: async (userId, shippingAddressInput) => {
		if (typeof shippingAddressInput === 'string') {
			const address = await Address.findOne({
				where: { userId, alias: shippingAddressInput },
			});
			if (!address)
				throw new NotFound(
					`Address with alias '${shippingAddressInput}' not found.`,
				);
			return address.id;
		}

		if (typeof shippingAddressInput === 'object') {
			if (shippingAddressInput.isDefault) {
				await Address.update(
					{ isDefault: false },
					{ where: { userId, isDefault: true } },
				);
			}
			const newAddress = await Address.create({
				...shippingAddressInput,
				userId,
			});
			return newAddress.id;
		}

		const defaultAddress = await Address.findOne({
			where: { userId, isDefault: true },
		});
		if (!defaultAddress) {
			throw new UnprocessableEntity(
				'No default address found. Please provide a shipping address.',
			);
		}
		return defaultAddress.id;
	},

	resolveOrderItems: async (userId, useCart, directItems) => {
		if (useCart) {
			const cartItems = await CartItem.findAll({
				where: { userId },
				include: [Product],
			});
			if (cartItems.length === 0)
				throw new UnprocessableEntity('Cart is empty.');
			return cartItems.map((item) => ({
				productId: item.productId,
				quantity: item.quantity,
			}));
		}

		if (!directItems || directItems.length === 0) {
			throw new UnprocessableEntity('No items provided for order.');
		}
		return directItems;
	},

	validateAndPrepareOrderItems: async (orderItems) => {
		let total = 0;
		const orderItemsWithDetails = [];

		for (const item of orderItems) {
			const product = await Product.findByPk(item.productId, {
				include: [Seller],
			});
			if (!product)
				throw new NotFound(`Product with ID ${item.productId} not found.`);
			if (product.quantity < item.quantity) {
				throw new UnprocessableEntity(
					`Insufficient stock for product ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`,
				);
			}

			const itemTotal = product.price * item.quantity;
			total += itemTotal;

			orderItemsWithDetails.push({
				productId: product.id,
				sellerId: product.sellerId,
				productName: product.name,
				unitPrice: product.price,
				quantity: item.quantity,
			});

			await product.update({ quantity: product.quantity - item.quantity });
		}

		return { orderItemsWithDetails, total };
	},

	getAllOrders: async (userId) => {
		return Order.findAll({
			where: { userId },
			include: [{ model: OrderItem, include: [Product] }, Address],
			order: [['created_at', 'DESC']],
		});
	},

	getOrder: async (userId, orderId) => {
		const order = await Order.findOne({
			where: { id: orderId, userId },
			include: [
				{ model: OrderItem, include: [Product, Seller] },
				Address,
				PaymentAttempt,
			],
		});

		if (!order) throw new NotFound('Order not found.');
		return order;
	},

	cancelOrder: async (userId, orderId) => {
		const order = await Order.findOne({
			where: { id: orderId, userId },
			include: [OrderItem],
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
			for (const item of cancellableItems) {
				await item.update(
					{
						status: OrderItemStatus.CANCELLED,
						cancelledBy: CancellationBy.BUYER,
					},
					{ transaction },
				);

				const product = await Product.findByPk(item.productId);
				if (product) {
					await product.update(
						{ quantity: product.quantity + item.quantity },
						{ transaction },
					);
				}
			}
		});

		return Order.findByPk(orderId, { include: [OrderItem, Address] });
	},

	getOrderStatus: async (orderId) => {
		const orderItems = await OrderItem.findAll({ where: { orderId } });
		const statusCounts = orderItems.reduce((acc, item) => {
			acc[item.status] = (acc[item.status] || 0) + 1;
			return acc;
		}, {});

		return {
			orderId,
			statusCounts,
			totalItems: orderItems.length,
		};
	},
};

interface OrderService {
	placeOrder: (
		userId: string,
		rawOrderData: any,
		useCart?: boolean,
	) => Promise<Order | null>;
	resolveShippingAddress: (
		userId: string,
		shippingAddressInput: any,
	) => Promise<string>;
	resolveOrderItems: (
		userId: string,
		useCart: boolean,
		directItems: any[],
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
	getOrder: (userId: string, orderId: string) => Promise<Order>;
	cancelOrder: (userId: string, orderId: string) => Promise<Order | null>;
	getOrderStatus: (orderId: string) => Promise<{
		orderId: string;
		statusCounts: Record<string, number>;
		totalItems: number;
	}>;
}
