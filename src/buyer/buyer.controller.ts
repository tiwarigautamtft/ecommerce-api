import assert from 'assert';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { InferAttributes, Op, WhereOptions } from 'sequelize';
import z from 'zod';

import { CartItem } from '@/cart';
import { sequelize } from '@/lib/config';
import { Product } from '@/product';
import { Role, RoleName, UserRole } from '@/role';

import { Buyer } from '.';
import {
	AddToCartDto,
	CreateBuyerProfileSchema,
	SearchProductDto,
	UpdateCartDto,
} from './dto';

export const buyerController: BuyerController = {
	getCurrentBuyerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const profile = await Buyer.scope('withoutUserId').findOne({
			where: { userId: req.user.id },
		});

		if (!profile) {
			res
				.status(StatusCodes.NOT_FOUND)
				.json({ message: 'Buyer profile not found.' });
			return;
		}

		res.status(StatusCodes.OK).json(profile);
	},

	createCurrentBuyerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const validationResult = await CreateBuyerProfileSchema.safeParseAsync(
			req.body,
		);

		if (validationResult.error) {
			console.error('Input validation failed:', validationResult.error);
			res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
				message: 'Invalid input data.',
				error: z.treeifyError(validationResult.error),
			});
			return;
		}

		const data = validationResult.data;

		const user = req.user;
		let result;
		try {
			result = await sequelize.transaction(async (transaction) => {
				const buyer = await Buyer.create(
					{
						...data,
						userId: user.id,
					},
					{ transaction },
				);

				const [role, _wasCreated] = await Role.findOrCreate({
					where: { name: RoleName.BUYER },
					transaction,
				});

				await UserRole.create(
					{
						userId: user.id,
						roleId: role.id,
					},
					{ transaction },
				);

				return buyer;
			});
		} catch (error) {
			if ((error as any).name === 'SequelizeUniqueConstraintError') {
				res
					.status(StatusCodes.BAD_REQUEST)
					.json({ message: 'Buyer profile already exists.' });
			} else {
				res
					.status(StatusCodes.INTERNAL_SERVER_ERROR)
					.json({ message: 'Could not create buyer profile.' });
			}
			return;
		}

		// emitter.emit(UserEvent.BUYER_PROFILE_CREATED, {
		// 	userId: req.user.id,
		// 	buyerId: result.id,
		// });

		req.user.roles = [...(req.user.roles || []), RoleName.BUYER];

		const { userId, ...newProfile } = result.toJSON();
		res.status(StatusCodes.CREATED).json(newProfile);
	},

	deleteCurrentBuyerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const transaction = await sequelize.transaction();
		let result = await Buyer.destroy({
			where: { userId: req.user.id },
			transaction,
		});
		if (result === 0) {
			res
				.status(StatusCodes.NOT_FOUND)
				.json({ message: 'Buyer profile not found.' });
			return;
		}

		const role = await Role.findOne({
			where: { name: RoleName.BUYER },
		});

		if (!role) {
			await transaction.rollback();
			res
				.status(StatusCodes.INTERNAL_SERVER_ERROR)
				.json({ message: 'Could not find buyer role.' });
			return;
		}

		result = await UserRole.destroy({
			where: { userId: req.user.id, roleId: role.id },
			transaction,
		});
		if (result === 0) {
			await transaction.rollback();
			res
				.status(StatusCodes.INTERNAL_SERVER_ERROR)
				.json({ message: 'Could not delete buyer role.' });
			return;
		}
		await transaction.commit();

		// emitter.emit(UserEvent.BUYER_PROFILE_DELETED, req.user.id);

		req.user.roles = (req.user.roles || []).filter(
			(role) => role !== RoleName.BUYER,
		);
		res.status(StatusCodes.OK).json({ message: 'Buyer profile deleted.' });
	},

	getProductById: async (req, res) => {
		const productId = req.params.productId;
		const product = await Product.findByPk(productId);

		if (!product) {
			res.status(StatusCodes.NOT_FOUND).json({ message: 'Product not found' });
			return;
		}

		res.status(StatusCodes.OK).json(product);
	},

	searchOwnProducts: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const buyer = await Buyer.findOne({ where: { userId: req.user?.id } });
		if (!buyer) {
			res
				.status(StatusCodes.NOT_FOUND)
				.json({ message: 'Buyer profile not found.' });
			return;
		}

		const validationResult = await SearchProductDto.safeParseAsync(req.query);
		if (validationResult.error) {
			console.error('Input validation failed:', validationResult.error);
			res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
				message: 'Invalid query parameters.',
				error: z.treeifyError(validationResult.error),
			});
			return;
		}

		const data = validationResult.data;
		const { name, sortBy, sortOrder, minPrice, maxPrice, page, limit } = data;

		const whereClause:
			| WhereOptions<
					InferAttributes<
						Product,
						{
							omit: never;
						}
					>
			  >
			| undefined = {
			...(name ? { name: { [Op.iLike]: `%${name}%` } } : {}),
			...(minPrice !== undefined ? { price: { [Op.gte]: minPrice } } : {}),
			...(maxPrice !== undefined ? { price: { [Op.lte]: maxPrice } } : {}),
		};

		const { rows: products, count } = await Product.findAndCountAll({
			limit,
			offset: (page - 1) * limit,
			where: whereClause,
			order: [[sortBy, sortOrder.toUpperCase()]],
		});

		const searchResult = {
			total: count,
			page,
			limit,
			products,
		};

		res.status(StatusCodes.OK).json(searchResult);
	},

	getCart: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const user = req.user;
		const buyer = await Buyer.findOne({
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
		if (!buyer) {
			res
				.status(StatusCodes.NOT_FOUND)
				.json({ message: 'Buyer profile not found.' });
			return;
		}

		const cart = buyer.toJSON().cartItems;

		res.status(StatusCodes.OK).json(cart);
	},

	addToCart: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const buyer = await Buyer.findOne({ where: { userId: user.id } });
		if (!buyer) {
			res
				.status(StatusCodes.NOT_FOUND)
				.json({ message: 'Buyer profile not found.' });
			return;
		}

		const validationResult = await AddToCartDto.safeParseAsync(req.body);
		if (validationResult.error) {
			console.error('Input validation failed:', validationResult.error);
			res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
				message: 'Invalid query parameters.',
				error: z.treeifyError(validationResult.error),
			});
			return;
		}

		const { productId, quantity } = validationResult.data;

		const product = await Product.findByPk(productId);
		if (!product) {
			res.status(StatusCodes.NOT_FOUND).json({ message: 'Product not found.' });
			return;
		}

		let result;
		try {
			result = await CartItem.create({
				buyerId: buyer.id,
				productId: product.id,
				quantity,
			});
		} catch (error) {
			if ((error as any).name === 'SequelizeUniqueConstraintError') {
				res
					.status(StatusCodes.CONFLICT)
					.json({ message: 'Product already in cart.' });
				return;
			}
			res
				.status(StatusCodes.INTERNAL_SERVER_ERROR)
				.json({ message: 'Could not add to cart.', error });
			return;
		}

		res.status(StatusCodes.CREATED).json(result);
	},

	updateCartItem: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const buyer = await Buyer.findOne({ where: { userId: user.id } });
		if (!buyer) {
			res
				.status(StatusCodes.NOT_FOUND)
				.json({ message: 'Buyer profile not found.' });
			return;
		}

		const validationResult = await UpdateCartDto.safeParseAsync(req.body);
		if (validationResult.error) {
			console.error('Input validation failed:', validationResult.error);
			res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
				message: 'Invalid query parameters.',
				error: z.treeifyError(validationResult.error),
			});
			return;
		}

		const { quantity } = validationResult.data;
		const { itemId } = req.params;

		const cartItem = await CartItem.findByPk(itemId);
		if (!cartItem) {
			res
				.status(StatusCodes.NOT_FOUND)
				.json({ message: 'Cart Item not found.' });
			return;
		}

		if (cartItem.buyerId !== buyer.id) {
			res
				.status(StatusCodes.FORBIDDEN)
				.json({ message: 'Forbidden. This item is not in your cart.' });
			return;
		}

		cartItem.quantity = quantity;
		await cartItem.save();

		res.status(StatusCodes.OK).json(cartItem);
	},

	removeFromCart: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const buyer = await Buyer.findOne({ where: { userId: user.id } });
		if (!buyer) {
			res
				.status(StatusCodes.NOT_FOUND)
				.json({ message: 'Buyer profile not found.' });
			return;
		}

		const { itemId } = req.params;

		await CartItem.destroy({ where: { id: itemId } });
		res.status(StatusCodes.OK).json({ message: 'Item removed from cart.' });
	},

	clearCart: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const buyer = await Buyer.findOne({ where: { userId: user.id } });
		if (!buyer) {
			res
				.status(StatusCodes.NOT_FOUND)
				.json({ message: 'Buyer profile not found.' });
			return;
		}

		await CartItem.destroy({ where: { buyerId: buyer.id } });
		res.status(StatusCodes.OK).json({ message: 'Cart cleared.' });
	},
};

interface BuyerController {
	getCurrentBuyerProfile: RequestHandler;
	createCurrentBuyerProfile: RequestHandler;
	deleteCurrentBuyerProfile: RequestHandler;

	getProductById: RequestHandler;

	searchOwnProducts: RequestHandler;

	getCart: RequestHandler;
	addToCart: RequestHandler;
	updateCartItem: RequestHandler;
	removeFromCart: RequestHandler;
	clearCart: RequestHandler;
}
