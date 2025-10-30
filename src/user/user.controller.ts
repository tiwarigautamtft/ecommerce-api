import assert from 'assert';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import z from 'zod';

import { Address } from '@/address';
import { CartItem } from '@/cart';
import { sequelize } from '@/lib/config';
import { emitter } from '@/lib/events/emitter';
import {
	Forbidden,
	InternalServerError,
	NotFound,
	SequelizeUniqueConstraintError,
	UnprocessableEntity,
} from '@/lib/exceptions';
import { CancellationBy, Order, OrderItem, OrderItemStatus } from '@/order';
import { PaymentAttempt, PaymentStatus } from '@/payment';
import { Product } from '@/product';
import { Seller } from '@/seller';

import { User, UserEvent } from '.';
import {
	AddToCartDto,
	CreateAddressDto,
	CreatePaymentDto,
	PlaceOrderDto,
	UpdateAddressDto,
	UpdateCartDto,
} from './dto';

export const userController: UserController = {
	getCurrentUser: (req, res) => {
		res.json(req.user);
	},

	deleteCurrentUser: async (req, res) => {
		await User.destroy({ where: { id: req.user?.id } });

		emitter.emit(UserEvent.DELETED, req.user?.id);

		req.logout((error) => {
			if (error) {
				req.user = undefined;
				console.error('User logged out manually');
			} else {
				res
					.status(StatusCodes.OK)
					.json({ message: 'User deleted and logout successful' });
			}
		});
	},

	getCart: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const user = req.user;
		const cartItems = await CartItem.findAll({
			where: { userId: user.id },
			include: [
				{
					model: Product,
					as: 'cartItems',
					attributes: ['id', 'name', 'description', 'price'],
					through: {
						attributes: ['id', 'quantity'],
						as: 'detail',
					},
				},
			],
		});

		res.status(StatusCodes.OK).json(cartItems);
	},

	addToCart: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;

		const validationResult = await AddToCartDto.safeParseAsync(req.body);
		if (validationResult.error) {
			throw new UnprocessableEntity(
				'Invalid query parameters.',
				z.treeifyError(validationResult.error),
			);
		}

		const { productId, quantity } = validationResult.data;

		const product = await Product.findByPk(productId);
		if (!product) {
			throw new NotFound('Product not found.');
		}

		let result;
		try {
			result = await CartItem.create({
				userId: user.id,
				productId: product.id,
				quantity,
			});
		} catch (error) {
			if ((error as any).name === 'SequelizeUniqueConstraintError') {
				throw new SequelizeUniqueConstraintError('Product already in cart.');
			}
			throw new InternalServerError('Could not add to cart.');
		}

		res.status(StatusCodes.CREATED).json(result);
	},

	updateCartItem: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;

		const validationResult = await UpdateCartDto.safeParseAsync(req.body);
		if (validationResult.error) {
			throw new UnprocessableEntity(
				'Invalid query parameters.',
				z.treeifyError(validationResult.error),
			);
		}

		const { quantity } = validationResult.data;
		const { itemId } = req.params;

		const cartItem = await CartItem.findByPk(itemId);
		if (!cartItem) {
			throw new NotFound('Cart Item not found.');
		}

		if (cartItem.userId !== user.id) {
			throw new Forbidden('Forbidden. This item is not in your cart.');
		}

		cartItem.quantity = quantity;
		await cartItem.save();

		res.status(StatusCodes.OK).json(cartItem);
	},

	removeFromCart: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;

		const { itemId } = req.params;

		await CartItem.destroy({ where: { id: itemId, userId: user.id } });
		res.status(StatusCodes.OK).json({ message: 'Item removed from cart.' });
	},

	clearCart: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;

		await CartItem.destroy({ where: { userId: user.id } });
		res.status(StatusCodes.OK).json({ message: 'Cart cleared.' });
	},

	getAllAddresses: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const addresses = await Address.findAll({
			where: { userId: user.id },
			order: [
				['is_default', 'DESC'],
				['created_at', 'DESC'],
			],
		});

		res.status(StatusCodes.OK).json(addresses);
	},

	getAddress: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const { addressId } = req.params;

		const address = await Address.findOne({
			where: { id: addressId, userId: user.id },
		});

		if (!address) {
			throw new NotFound('Address not found.');
		}

		res.status(StatusCodes.OK).json(address);
	},

	createAddress: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const validationResult = await CreateAddressDto.safeParseAsync(req.body);

		if (validationResult.error) {
			throw new UnprocessableEntity(
				'Invalid address data.',
				z.treeifyError(validationResult.error),
			);
		}

		const addressData = validationResult.data;

		try {
			const address = await sequelize.transaction(async (transaction) => {
				if (addressData.isDefault) {
					await Address.update(
						{ isDefault: false },
						{ where: { userId: user.id, isDefault: true }, transaction },
					);
				}

				const address = await Address.create(
					{
						...addressData,
						userId: user.id,
					},
					{ transaction },
				);

				return address;
			});

			res.status(StatusCodes.CREATED).json(address);
		} catch (error) {
			if ((error as any)?.name === 'SequelizeUniqueConstraintError') {
				throw new SequelizeUniqueConstraintError(
					`Address with alias '${addressData.alias}' already exists for this user.`,
				);
			}
			throw error;
		}
	},

	updateAddress: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const { addressId } = req.params;

		const validationResult = await UpdateAddressDto.safeParseAsync(req.body);
		if (validationResult.error) {
			throw new UnprocessableEntity(
				'Invalid address data.',
				z.treeifyError(validationResult.error),
			);
		}

		const updateData = validationResult.data;

		const address = await Address.findOne({
			where: { id: addressId, userId: user.id },
		});

		if (!address) {
			throw new NotFound('Address not found.');
		}

		if (updateData.isDefault) {
			await Address.update(
				{ isDefault: false },
				{ where: { userId: user.id, isDefault: true } },
			);
		}

		await address.update(updateData);

		res.status(StatusCodes.OK).json(address);
	},

	deleteAddress: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const { addressId } = req.params;

		const address = await Address.findOne({
			where: { id: addressId, userId: user.id },
		});

		if (!address) {
			throw new NotFound('Address not found.');
		}

		await address.destroy();

		res
			.status(StatusCodes.OK)
			.json({ message: 'Address deleted successfully.' });
	},

	placeOrder: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const validationResult = await PlaceOrderDto.safeParseAsync(req.body);

		if (validationResult.error) {
			throw new UnprocessableEntity(
				'Invalid order data.',
				z.treeifyError(validationResult.error),
			);
		}

		const { shippingAddress: shippingAddressInput, items: directItems } =
			validationResult.data;
		const useCart = req.query.cart === 'true';

		let shippingAddressId: string;

		if (typeof shippingAddressInput === 'string') {
			const address = await Address.findOne({
				where: { userId: user.id, alias: shippingAddressInput },
			});

			if (!address) {
				throw new NotFound(
					`Address with alias '${shippingAddressInput}' not found.`,
				);
			}

			shippingAddressId = address.id;
		} else if (typeof shippingAddressInput === 'object') {
			if (shippingAddressInput.isDefault) {
				await Address.update(
					{ isDefault: false },
					{ where: { userId: user.id, isDefault: true } },
				);
			}

			const newAddress = await Address.create({
				...shippingAddressInput,
				userId: user.id,
			});

			shippingAddressId = newAddress.id;
		} else {
			const defaultAddress = await Address.findOne({
				where: { userId: user.id, isDefault: true },
			});

			if (!defaultAddress) {
				throw new UnprocessableEntity(
					'No default address found. Please provide a shipping address.',
				);
			}

			shippingAddressId = defaultAddress.id;
		}

		let orderItems: Array<{ productId: string; quantity: number }> = [];

		if (useCart) {
			const cartItems = await CartItem.findAll({
				where: { userId: user.id },
				include: [Product],
			});

			if (cartItems.length === 0) {
				throw new UnprocessableEntity('Cart is empty.');
			}

			orderItems = cartItems.map((item) => ({
				productId: item.productId,
				quantity: item.quantity,
			}));
		} else {
			if (!directItems || directItems.length === 0) {
				throw new UnprocessableEntity('No items provided for order.');
			}
			orderItems = directItems;
		}

		let total = 0;
		const orderItemsWithDetails = [];

		for (const item of orderItems) {
			const product = await Product.findByPk(item.productId, {
				include: [Seller],
			});

			if (!product) {
				throw new NotFound(`Product with ID ${item.productId} not found.`);
			}

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

		const order = await sequelize.transaction(async (transaction) => {
			const order = await Order.create(
				{
					userId: user.id,
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
					where: { userId: user.id },
					transaction,
				});
			}

			return order;
		});

		const orderWithItems = await Order.findByPk(order.id, {
			include: [OrderItem, Address],
		});

		res.status(StatusCodes.CREATED).json(orderWithItems);
	},

	getAllOrders: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const orders = await Order.findAll({
			where: { userId: user.id },
			include: [
				{
					model: OrderItem,
					include: [Product],
				},
				Address,
			],
			order: [['created_at', 'DESC']],
		});

		res.status(StatusCodes.OK).json(orders);
	},

	getOrder: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const { orderId } = req.params;

		const order = await Order.findOne({
			where: { id: orderId, userId: user.id },
			include: [
				{
					model: OrderItem,
					include: [Product, Seller],
				},
				Address,
				PaymentAttempt,
			],
		});

		if (!order) {
			throw new NotFound('Order not found.');
		}

		res.status(StatusCodes.OK).json(order);
	},

	cancelOrder: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const { orderId } = req.params;

		const order = await Order.findOne({
			where: { id: orderId, userId: user.id },
			include: [OrderItem],
		});

		if (!order) {
			throw new NotFound('Order not found.');
		}

		const cancellableItems = order.OrderItems.filter(
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
						{
							quantity: product.quantity + item.quantity,
						},
						{ transaction },
					);
				}
			}
		});

		const updatedOrder = await Order.findByPk(orderId, {
			include: [OrderItem, Address],
		});

		res.status(StatusCodes.OK).json(updatedOrder);
	},
	makePaymentForOrder: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const { orderId } = req.params;

		const validationResult = await CreatePaymentDto.safeParseAsync(req.body);
		if (validationResult.error) {
			throw new UnprocessableEntity(
				'Invalid payment data.',
				z.treeifyError(validationResult.error),
			);
		}

		const { amount } = validationResult.data;

		const order = await Order.findOne({
			where: { id: orderId, userId: user.id },
		});

		if (!order) {
			throw new NotFound('Order not found.');
		}

		// Mock payment processing - simulate random success/failure
		const isSuccess = Math.random() > 0.3; // 70% success rate
		const mockPaymentStatus = isSuccess
			? PaymentStatus.SUCCESS
			: PaymentStatus.FAILURE;

		const paymentAttempt = await PaymentAttempt.create({
			orderId: order.id,
			amount,
			status: mockPaymentStatus,
		});

		// Simulate payment processing delay
		await new Promise((resolve) => setTimeout(resolve, 1000));

		res.status(StatusCodes.CREATED).json(paymentAttempt);
	},

	getAllPaymentsForOrder: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const { orderId } = req.params;

		const order = await Order.findOne({
			where: { id: orderId, userId: user.id },
		});

		if (!order) {
			throw new NotFound('Order not found.');
		}

		const paymentAttempts = await PaymentAttempt.findAll({
			where: { orderId: order.id },
			order: [['created_at', 'DESC']],
		});

		res.status(StatusCodes.OK).json(paymentAttempts);
	},

	getAPaymentForOrder: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const { orderId, paymentId } = req.params;

		const order = await Order.findOne({
			where: { id: orderId, userId: user.id },
		});

		if (!order) {
			throw new NotFound('Order not found.');
		}

		const paymentAttempt = await PaymentAttempt.findOne({
			where: { id: paymentId, orderId: order.id },
		});

		if (!paymentAttempt) {
			throw new NotFound('Payment attempt not found.');
		}

		res.status(StatusCodes.OK).json(paymentAttempt);
	},
};

interface UserController {
	getCurrentUser: RequestHandler;
	deleteCurrentUser: RequestHandler;

	getCart: RequestHandler;
	addToCart: RequestHandler;
	updateCartItem: RequestHandler;
	removeFromCart: RequestHandler;
	clearCart: RequestHandler;

	getAllAddresses: RequestHandler;
	getAddress: RequestHandler;
	createAddress: RequestHandler;
	updateAddress: RequestHandler;
	deleteAddress: RequestHandler;

	placeOrder: RequestHandler;
	getAllOrders: RequestHandler;
	getOrder: RequestHandler;
	cancelOrder: RequestHandler;

	makePaymentForOrder: RequestHandler;
	getAllPaymentsForOrder: RequestHandler;
	getAPaymentForOrder: RequestHandler;
}
