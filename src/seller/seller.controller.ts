import assert from 'assert';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { InferAttributes, Op, WhereOptions } from 'sequelize';
import z from 'zod';

import { sequelize } from '@/lib/config';
import {
	BadRequest,
	Forbidden,
	InternalServerError,
	NotFound,
	SequelizeUniqueConstraintError,
	UnprocessableEntity,
} from '@/lib/exceptions';
import { Product } from '@/product';
import { Role, RoleName, UserRole } from '@/role';

import { CreateProductDto, SearchProductDto, UpdateProductDto } from './dto';
import { Seller } from './seller.model';

export const sellerController: SellerController = {
	getCurrentSellerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const profile = await Seller.scope('withoutUserId').findOne({
			where: { userId: req.user.id },
		});

		if (!profile) {
			throw new NotFound('Seller profile not found.');
		}

		res.status(StatusCodes.OK).json(profile);
	},

	createCurrentSellerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		if (!req.body) {
			throw new Forbidden('Request body is required.');
		}

		const { storeName } = req.body;
		if (!storeName) {
			throw new BadRequest('storeName is required.');
		}

		const user = req.user;
		let result;
		try {
			result = await sequelize.transaction(async (transaction) => {
				const seller = await Seller.create(
					{
						storeName,
						userId: user.id,
					},
					{ transaction },
				);

				const [role, _wasCreated] = await Role.findOrCreate({
					where: { name: RoleName.SELLER },
					transaction,
				});

				await UserRole.create(
					{
						userId: user.id,
						roleId: role.id,
					},
					{ transaction },
				);

				return seller;
			});
		} catch (error) {
			if ((error as any).name === 'SequelizeUniqueConstraintError') {
				throw new SequelizeUniqueConstraintError(
					'Seller profile already exists.',
				);
			}

			throw new InternalServerError('Could not create seller profile.');
		}

		// emitter.emit(UserEvent.SELLER_PROFILE_CREATED, {
		// 	userId: req.user.id,
		// 	sellerId: result.id,
		// });

		req.user.roles = [...(req.user.roles || []), RoleName.SELLER];

		const { userId, ...newProfile } = result.toJSON();
		res.status(StatusCodes.CREATED).json(newProfile);
	},

	deleteCurrentSellerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const transaction = await sequelize.transaction();
		let result = await Seller.destroy({
			where: { userId: req.user.id },
			transaction,
		});
		if (result === 0) {
			throw new NotFound('Seller profile not found.');
		}

		const role = await Role.findOne({
			where: { name: RoleName.SELLER },
		});

		if (!role) {
			await transaction.rollback();
			throw new InternalServerError('Could not find seller role.');
		}

		result = await UserRole.destroy({
			where: { userId: req.user.id, roleId: role.id },
			transaction,
		});
		if (result === 0) {
			await transaction.rollback();
			throw new InternalServerError('Could not delete seller role.');
		}
		await transaction.commit();

		// emitter.emit(UserEvent.SELLER_PROFILE_DELETED, req.user.id);

		req.user.roles = (req.user.roles || []).filter(
			(role) => role !== RoleName.SELLER,
		);
		res.status(StatusCodes.OK).json({ message: 'Seller profile deleted.' });
	},

	createProduct: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const validationResult = await CreateProductDto.safeParseAsync(req.body);

		if (validationResult.error) {
			throw new UnprocessableEntity(
				'Invalid input data.',
				z.treeifyError(validationResult.error),
			);
		}

		const data = validationResult.data;
		const user = req.user;
		const seller = await Seller.findOne({ where: { userId: user.id } });
		if (!seller) {
			throw new NotFound('Seller profile not found.');
		}
		const sellerId = seller.id;

		const product = await Product.create({ ...data, sellerId });
		res.status(StatusCodes.CREATED).json(product);
	},

	getAllProducts: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const seller = await Seller.findOne({ where: { userId: user.id } });

		if (!seller) {
			throw new NotFound('Seller profile not found.');
		}

		const sellerId = seller.id;

		const products = await Product.findAll({ where: { sellerId } });
		res.status(StatusCodes.OK).json(products);
	},

	getProductById: async (req, res) => {
		const productId = req.params.productId;
		const product = await Product.findByPk(productId);

		if (!product) {
			throw new NotFound('Product not found');
		}

		res.status(StatusCodes.OK).json(product);
	},

	updateProductById: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const productId = req.params.productId;
		const validationResult = await UpdateProductDto.safeParseAsync(req.body);

		if (validationResult.error) {
			console.error('Input validation failed:', validationResult.error);
			throw new UnprocessableEntity(
				'Invalid input data.',
				z.treeifyError(validationResult.error),
			);
		}

		const data = validationResult.data;
		const user = req.user;
		const seller = await Seller.findOne({ where: { userId: user.id } });

		if (!seller) {
			throw new NotFound('Seller profile not found.');
		}

		const [affectedRows, updatedProducts] = await Product.update(data, {
			where: { id: productId, sellerId: seller.id },
			returning: true,
		});

		if (affectedRows === 0) {
			throw new InternalServerError('Could not update product');
		}

		res.status(StatusCodes.OK).json(updatedProducts[0]);
	},

	deleteAllProducts: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const seller = await Seller.findOne({ where: { userId: user.id } });

		if (!seller) {
			throw new NotFound('Seller profile not found.');
		}

		try {
			await Product.destroy({ where: { sellerId: seller.id } });
		} catch (error) {
			throw new InternalServerError('Could not delete products');
		}

		res.status(StatusCodes.OK).json({ message: 'All products deleted' });
	},

	deleteProductById: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const seller = await Seller.findOne({ where: { userId: user.id } });

		if (!seller) {
			throw new NotFound('Seller profile not found.');
		}

		const productId = req.params.productId;

		await Product.destroy({
			where: { id: productId, sellerId: seller.id },
		});

		res.status(StatusCodes.OK).json({ message: 'Product deleted' });
	},

	searchOwnProducts: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const seller = await Seller.findOne({ where: { userId: req.user?.id } });
		if (!seller) {
			throw new NotFound('Seller profile not found.');
		}

		const validationResult = await SearchProductDto.safeParseAsync(req.query);
		if (validationResult.error) {
			throw new UnprocessableEntity(
				'Invalid query parameters.',
				z.treeifyError(validationResult.error),
			);
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
			sellerId: seller.id,
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
};

interface SellerController {
	getCurrentSellerProfile: RequestHandler;
	createCurrentSellerProfile: RequestHandler;
	deleteCurrentSellerProfile: RequestHandler;

	createProduct: RequestHandler;
	getAllProducts: RequestHandler;
	getProductById: RequestHandler;
	updateProductById: RequestHandler;
	deleteAllProducts: RequestHandler;
	deleteProductById: RequestHandler;

	searchOwnProducts: RequestHandler;
}
