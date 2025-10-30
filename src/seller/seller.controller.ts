import assert from 'assert';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { InferAttributes, Op, WhereOptions } from 'sequelize';
import z from 'zod';

import { Address } from '@/address';
import { sequelize } from '@/lib/config';
import {
	BadRequest,
	Forbidden,
	InternalServerError,
	NotFound,
	SequelizeUniqueConstraintError,
	UnprocessableEntity,
} from '@/lib/exceptions';
import { Order, OrderItem } from '@/order';
import { Product, ProductTag, Tag } from '@/product';
import { Role, RoleName, UserRole } from '@/role';

import {
	CreateProductDto,
	CreateSellerProfileDto,
	SearchProductDto,
	UpdateProductDto,
} from './dto';
import { CreateProductTagsDto } from './dto/create-product-tag.dto';
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

		const validationResult = await CreateSellerProfileDto.safeParseAsync(
			req.body,
		);
		if (validationResult.error) {
			throw new UnprocessableEntity(
				'Invalid input data.',
				z.treeifyError(validationResult.error),
			);
		}

		const { storeName } = validationResult.data;

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
			if ((error as any)?.name === 'SequelizeUniqueConstraintError') {
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

		const user = req.user;

		await sequelize.transaction(async (transaction) => {
			const seller = await Seller.findOne({
				where: { userId: user.id },
				transaction,
			});

			if (!seller) {
				throw new NotFound('Seller profile not found.');
			}

			const role = await Role.findOne({
				where: { name: RoleName.SELLER },
				transaction,
			});

			if (!role) {
				throw new InternalServerError('Could not find seller role.');
			}

			await Promise.all([
				Seller.destroy({
					where: { userId: user.id },
					transaction,
				}),
				UserRole.destroy({
					where: { userId: user.id, roleId: role.id },
					transaction,
				}),
			]);
		});

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

		const seller = await Seller.findOne({
			where: { userId: req.user.id },
			attributes: ['id'],
		});
		if (!seller) {
			throw new NotFound('Seller profile not found.');
		}

		const data = validationResult.data;
		const product = await Product.create({ ...data, sellerId: seller.id });

		// TODO: Make AI generated tags based on product name and description

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

		const seller = await Seller.findOne({ where: { userId: req.user.id } });
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
		const {
			name,
			sortBy,
			sortOrder,
			minPrice,
			maxPrice,
			page,
			limit,
			isPublished,
			minQuantity,
			maxQuantity,
		} = data;

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
			...(isPublished !== undefined ? { isPublished } : {}),
			...(name ? { name: { [Op.iLike]: `%${name}%` } } : {}),

			// Price range filter >= minprice and <= maxprice
			...(minPrice !== undefined || maxPrice !== undefined
				? {
						price: {
							...(minPrice !== undefined ? { [Op.gte]: minPrice } : {}),
							...(maxPrice !== undefined ? { [Op.lte]: maxPrice } : {}),
						},
					}
				: {}),

			// Quantity range filter >= minQuantity and <= maxQuantity
			...(minQuantity !== undefined || maxQuantity !== undefined
				? {
						quantity: {
							...(minQuantity !== undefined ? { [Op.gte]: minQuantity } : {}),
							...(maxQuantity !== undefined ? { [Op.lte]: maxQuantity } : {}),
						},
					}
				: {}),
		};

		const { rows: products, count } = await Product.findAndCountAll({
			limit,
			offset: (page - 1) * limit,
			where: whereClause,
			order: [[sortBy, sortOrder.toUpperCase()]],
			attributes: { exclude: ['sellerId'] },
		});

		const searchResult = {
			total: count,
			page,
			limit,
			sort: { by: sortBy, order: sortOrder },
			products,
		};

		res.status(StatusCodes.OK).json(searchResult);
	},

	updatePublishedStatusOfAllProducts: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const validationResult = z
			.object({
				isPublished: z.boolean(),
			})
			.safeParse(req.body);

		if (validationResult.error) {
			throw new UnprocessableEntity(
				'Invalid input data.',
				z.treeifyError(validationResult.error),
			);
		}

		const { isPublished } = validationResult.data;
		const user = req.user;
		const seller = await Seller.findOne({ where: { userId: user.id } });

		if (!seller) {
			throw new NotFound('Seller profile not found.');
		}

		const [affectedRows] = await Product.update(
			{ isPublished },
			{ where: { sellerId: seller.id } },
		);

		res.status(StatusCodes.OK).json({
			message: `Updated published status for ${affectedRows} products`,
			updatedCount: affectedRows,
			isPublished,
		});
	},

	createProductTags: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const { productId } = req.params;
		const validationResult = await CreateProductTagsDto.safeParseAsync(
			req.body,
		);

		if (validationResult.error) {
			throw new UnprocessableEntity(
				'Invalid tag data.',
				z.treeifyError(validationResult.error),
			);
		}

		const { names } = validationResult.data;
		const seller = await Seller.findOne({ where: { userId: req.user.id } });

		if (!seller) {
			throw new NotFound('Seller profile not found.');
		}

		const product = await Product.findOne({
			where: { id: productId, sellerId: seller.id },
		});

		if (!product) {
			throw new NotFound('Product not found or access denied.');
		}

		const result = await sequelize.transaction(async (transaction) => {
			const normalizedNames = [
				...new Set(names.map((name) => name.trim().toLowerCase())),
			];

			const existingTags = await Tag.findAll({
				where: {
					name: normalizedNames,
				},
				transaction,
			});

			const existingTagNames = new Set(existingTags.map((tag) => tag.name));
			const newTagNames = normalizedNames.filter(
				(name) => !existingTagNames.has(name),
			);

			// Create new tags in bulk
			let newTags: Tag[] = [];
			if (newTagNames.length > 0) {
				newTags = await Tag.bulkCreate(
					newTagNames.map((name) => ({ name })),
					{ transaction, returning: true },
				);
			}

			const allTags = [...existingTags, ...newTags];

			// Check for existing product-tag relationships
			const existingProductTags = await ProductTag.findAll({
				where: {
					productId: product.id,
					tagId: allTags.map((tag) => tag.id),
				},
				transaction,
			});

			const existingProductTagIds = new Set(
				existingProductTags.map((pt) => pt.tagId),
			);
			const newProductTags = allTags.filter(
				(tag) => !existingProductTagIds.has(tag.id),
			);

			// Create new product-tag relationships
			let createdProductTags: ProductTag[] = [];
			if (newProductTags.length > 0) {
				createdProductTags = await ProductTag.bulkCreate(
					newProductTags.map((tag) => ({
						productId: product.id,
						tagId: tag.id,
					})),
					{ transaction, returning: true },
				);
			}

			return {
				created: createdProductTags,
				skipped: existingProductTags,
			};
		});

		let message: string;
		if (result.created.length === 0) {
			message = `All ${result.skipped.length} tags already exist on this product.`;
		} else if (result.skipped.length > 0) {
			message = `Successfully added ${result.created.length} tags (${result.skipped.length} already existed)`;
		} else {
			message = `Successfully added ${result.created.length} tags`;
		}

		res.status(StatusCodes.OK).json({
			message,
			createdTags: result.created,
			stats: {
				created: result.created.length,
				skipped: result.skipped.length,
			},
		});
	},

	getProductTags: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const { productId } = req.params;
		const seller = await Seller.findOne({ where: { userId: req.user.id } });

		if (!seller) {
			throw new NotFound('Seller profile not found.');
		}

		const product = await Product.findOne({
			where: { id: productId, sellerId: seller.id },
			include: [
				{
					model: Tag,
					as: 'tags',
					through: { attributes: [] },
				},
			],
		});

		if (!product) {
			throw new NotFound('Product not found or access denied.');
		}

		res.status(StatusCodes.OK).json(product.tags);
	},

	removeTagFromProduct: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const { productId, tagId } = req.params;
		const seller = await Seller.findOne({ where: { userId: req.user.id } });

		if (!seller) {
			throw new NotFound('Seller profile not found.');
		}

		const product = await Product.findOne({
			where: { id: productId, sellerId: seller.id },
		});

		if (!product) {
			throw new NotFound('Product not found or access denied.');
		}

		const result = await ProductTag.destroy({
			where: { productId: product.id, tagId },
		});

		if (result === 0) {
			throw new NotFound('Tag not found on this product.');
		}

		res.status(StatusCodes.OK).json({ message: 'Tag removed from product.' });
	},

	getAllOrders: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const seller = await Seller.findOne({ where: { userId: req.user.id } });
		if (!seller) {
			throw new NotFound('Seller profile not found.');
		}

		const orders = await Order.findAll({
			include: [
				{
					model: OrderItem,
					where: { sellerId: seller.id },
					include: [Product],
					required: true,
				},
				{
					model: Address,
					as: 'shippingAddress',
				},
			],
			order: [
				['created_at', 'DESC'],
				[OrderItem, 'created_at', 'ASC'],
			],
		});

		const sellerOrders = orders.map((order) => ({
			orderId: order.id,
			orderNumber: order.orderNumber,
			totalAmount: order.total,
			createdAt: order.createdAt,
			updatedAt: order.updatedAt,
			shippingAddress: order.shippingAddress,
			orderItems: order.OrderItems.map((item) => ({
				itemId: item.id,
				product: item.Product,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				status: item.status,
				cancelledBy: item.cancelledBy,
			})),
		}));

		res.status(StatusCodes.OK).json({
			orders: sellerOrders,
			totalOrders: sellerOrders.length,
		});
	},

	getAnOrder: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const { orderId } = req.params;
		const seller = await Seller.findOne({ where: { userId: req.user.id } });

		if (!seller) {
			throw new NotFound('Seller profile not found.');
		}

		const orderItems = await OrderItem.findAll({
			where: { orderId, sellerId: seller.id },
			include: [
				{
					model: Order,
					include: [
						{
							model: Address,
							as: 'shippingAddress',
						},
					],
				},
				Product,
			],
		});

		if (orderItems.length === 0) {
			throw new NotFound('Order not found or access denied.');
		}

		const order = {
			...orderItems[0].Order.toJSON(),
			items: orderItems,
		};

		res.status(StatusCodes.OK).json(order);
	},

	updateOrderStatus: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const { orderId, itemId } = req.params;
		const validationResult = z
			.object({
				status: z.enum(Object.values(OrderItemStatus) as [string, ...string[]]),
			})
			.safeParse(req.body);

		if (validationResult.error) {
			throw new UnprocessableEntity(
				'Invalid status data.',
				z.treeifyError(validationResult.error),
			);
		}

		const { status } = validationResult.data;
		const seller = await Seller.findOne({ where: { userId: req.user.id } });

		if (!seller) {
			throw new NotFound('Seller profile not found.');
		}

		const orderItem = await OrderItem.findOne({
			where: {
				id: itemId,
				orderId,
				sellerId: seller.id,
			},
		});

		if (!orderItem) {
			throw new NotFound('Order item not found or access denied.');
		}

		// Validate status transition
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

		res.status(StatusCodes.OK).json(orderItem);
	},
};

interface SellerController {
	getCurrentSellerProfile: RequestHandler;
	createCurrentSellerProfile: RequestHandler;
	deleteCurrentSellerProfile: RequestHandler;

	searchOwnProducts: RequestHandler;
	createProduct: RequestHandler;
	getAllProducts: RequestHandler;
	getProductById: RequestHandler;
	updateProductById: RequestHandler;
	updatePublishedStatusOfAllProducts: RequestHandler;
	deleteAllProducts: RequestHandler;
	deleteProductById: RequestHandler;

	createProductTags: RequestHandler;
	getProductTags: RequestHandler;
	removeTagFromProduct: RequestHandler;

	getAllOrders: RequestHandler;
	getAnOrder: RequestHandler;
	updateOrderStatus: RequestHandler;
}
