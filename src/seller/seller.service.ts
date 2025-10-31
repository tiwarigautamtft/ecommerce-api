import { Op } from 'sequelize';
import z from 'zod';

import { Address } from '@/address/address.model';
import { sequelize } from '@/lib/config';
import {
	BadRequest,
	InternalServerError,
	NotFound,
	SequelizeUniqueConstraintError,
} from '@/lib/exceptions';
import { validateWithZodSchema } from '@/lib/utils';
import { OrderItem } from '@/order/order-item.model';
import { CancellationBy, OrderItemStatus } from '@/order/order.enum';
import { Order } from '@/order/order.model';
import { ProductTag } from '@/product/product-tag.model';
import { Product } from '@/product/product.model';
import { Tag } from '@/product/tag.model';
import { RoleName } from '@/role/role.enum';
import { Role } from '@/role/role.model';
import { UserRole } from '@/user/user-role.model';

import {
	CreateProductDto,
	CreateSellerProfileDto,
	SearchProductDto,
	UpdateProductDto,
} from './dto';
import { CreateProductTagsDto } from './dto/create-product-tag.dto';
import { Seller } from './seller.model';

export const sellerService: SellerService = {
	getCurrentSellerProfile: async (userId) => {
		const profile = await Seller.scope('withoutUserId').findOne({
			where: { userId },
		});
		if (!profile) throw new NotFound('Seller profile not found.');
		return profile;
	},

	createCurrentSellerProfile: async (userId, rawProfileData) => {
		const { storeName } = await validateWithZodSchema(
			CreateSellerProfileDto,
			rawProfileData,
			'Invalid profile data',
		);

		try {
			const result = await sequelize.transaction(async (transaction) => {
				const seller = await Seller.create(
					{ storeName, userId },
					{ transaction },
				);

				const [role] = await Role.findOrCreate({
					where: { name: RoleName.SELLER },
					transaction,
				});

				await UserRole.create({ userId, roleId: role.id }, { transaction });
				return seller;
			});

			return result;
		} catch (error) {
			if ((error as any)?.name === 'SequelizeUniqueConstraintError') {
				throw new SequelizeUniqueConstraintError(
					'Seller profile already exists.',
				);
			}
			throw new InternalServerError('Could not create seller profile.');
		}
	},

	deleteCurrentSellerProfile: async (userId) => {
		await sequelize.transaction(async (transaction) => {
			const seller = await Seller.findOne({ where: { userId }, transaction });
			if (!seller) throw new NotFound('Seller profile not found.');

			const role = await Role.findOne({
				where: { name: RoleName.SELLER },
				transaction,
			});
			if (!role) throw new InternalServerError('Could not find seller role.');

			await Promise.all([
				Seller.destroy({ where: { userId }, transaction }),
				UserRole.destroy({ where: { userId, roleId: role.id }, transaction }),
			]);
		});
	},

	createProduct: async (userId, rawProductData) => {
		const data = await validateWithZodSchema(
			CreateProductDto,
			rawProductData,
			'Invalid product data',
		);

		const seller = await Seller.findOne({
			where: { userId },
			attributes: ['id'],
		});
		if (!seller) throw new NotFound('Seller profile not found.');

		return Product.create({ ...data, sellerId: seller.id });
	},

	getAllProducts: async (userId) => {
		const seller = await Seller.findOne({ where: { userId } });
		if (!seller) throw new NotFound('Seller profile not found.');

		return Product.findAll({ where: { sellerId: seller.id } });
	},

	getProductById: async (productId) => {
		const product = await Product.findByPk(productId);
		if (!product) throw new NotFound('Product not found');
		return product;
	},

	updateProductById: async (userId, productId, rawUpdateData) => {
		const data = await validateWithZodSchema(
			UpdateProductDto,
			rawUpdateData,
			'Invalid product data',
		);

		const seller = await Seller.findOne({ where: { userId } });
		if (!seller) throw new NotFound('Seller profile not found.');

		const [affectedRows, updatedProducts] = await Product.update(data, {
			where: { id: productId, sellerId: seller.id },
			returning: true,
		});

		if (affectedRows === 0)
			throw new InternalServerError('Could not update product');
		return updatedProducts[0];
	},

	deleteAllProducts: async (userId) => {
		const seller = await Seller.findOne({ where: { userId } });
		if (!seller) throw new NotFound('Seller profile not found.');

		await Product.destroy({ where: { sellerId: seller.id } });
	},

	deleteProductById: async (userId, productId) => {
		const seller = await Seller.findOne({ where: { userId } });
		if (!seller) throw new NotFound('Seller profile not found.');

		await Product.destroy({ where: { id: productId, sellerId: seller.id } });
	},

	searchOwnProducts: async (userId, rawQueryParams) => {
		const data = await validateWithZodSchema(
			SearchProductDto,
			rawQueryParams,
			'Invalid query parameter(s)',
		);

		const seller = await Seller.findOne({ where: { userId } });
		if (!seller) throw new NotFound('Seller profile not found.');

		const whereClause = {
			sellerId: seller.id,
			...(data.isPublished !== undefined
				? { isPublished: data.isPublished }
				: {}),
			...(data.name ? { name: { [Op.iLike]: `%${data.name}%` } } : {}),
			...(data.minPrice !== undefined || data.maxPrice !== undefined
				? {
						price: {
							...(data.minPrice !== undefined
								? { [Op.gte]: data.minPrice }
								: {}),
							...(data.maxPrice !== undefined
								? { [Op.lte]: data.maxPrice }
								: {}),
						},
					}
				: {}),
			...(data.minQuantity !== undefined || data.maxQuantity !== undefined
				? {
						quantity: {
							...(data.minQuantity !== undefined
								? { [Op.gte]: data.minQuantity }
								: {}),
							...(data.maxQuantity !== undefined
								? { [Op.lte]: data.maxQuantity }
								: {}),
						},
					}
				: {}),
		};

		const { rows: products, count } = await Product.findAndCountAll({
			limit: data.limit,
			offset: (data.page - 1) * data.limit,
			where: whereClause,
			order: [[data.sortBy, data.sortOrder.toUpperCase()]],
			attributes: { exclude: ['sellerId'] },
		});

		return {
			total: count,
			page: data.page,
			limit: data.limit,
			sort: { by: data.sortBy, order: data.sortOrder },
			products,
		};
	},

	updatePublishedStatusOfAllProducts: async (userId, rawStatusData) => {
		const { isPublished } = await validateWithZodSchema(
			z.object({ isPublished: z.boolean() }),
			rawStatusData,
			'Invalid status data',
		);
		const seller = await Seller.findOne({ where: { userId } });
		if (!seller) throw new NotFound('Seller profile not found.');

		const [affectedRows] = await Product.update(
			{ isPublished },
			{ where: { sellerId: seller.id } },
		);

		return { updatedCount: affectedRows, isPublished };
	},

	createProductTags: async (userId, productId, rawTagData) => {
		const { names } = await validateWithZodSchema(
			CreateProductTagsDto,
			rawTagData,
			'Invalid tag data',
		);

		const seller = await Seller.findOne({ where: { userId } });
		if (!seller) throw new NotFound('Seller profile not found.');

		const product = await Product.findOne({
			where: { id: productId, sellerId: seller.id },
		});
		if (!product) throw new NotFound('Product not found or access denied.');

		const result = await sequelize.transaction(async (transaction) => {
			const normalizedNames = [
				...new Set(names.map((name: string) => name.trim().toLowerCase())),
			];

			const existingTags = await Tag.findAll({
				where: { name: normalizedNames },
				transaction,
			});
			const existingTagNames = new Set(existingTags.map((tag) => tag.name));
			const newTagNames = normalizedNames.filter(
				(name) => !existingTagNames.has(name),
			);

			let newTags: Tag[] = [];
			if (newTagNames.length > 0) {
				newTags = await Tag.bulkCreate(
					newTagNames.map((name) => ({ name })),
					{ transaction, returning: true },
				);
			}

			const allTags = [...existingTags, ...newTags];
			const existingProductTags = await ProductTag.findAll({
				where: { productId: product.id, tagId: allTags.map((tag) => tag.id) },
				transaction,
			});

			const existingProductTagIds = new Set(
				existingProductTags.map((pt) => pt.tagId),
			);
			const newProductTags = allTags.filter(
				(tag) => !existingProductTagIds.has(tag.id),
			);

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

			return { created: createdProductTags, skipped: existingProductTags };
		});

		return result;
	},

	getProductTags: async (userId, productId) => {
		const seller = await Seller.findOne({ where: { userId } });
		if (!seller) throw new NotFound('Seller profile not found.');

		const product = await Product.findOne({
			where: { id: productId, sellerId: seller.id },
			include: [{ model: Tag, as: 'tags', through: { attributes: [] } }],
		});

		if (!product) throw new NotFound('Product not found or access denied.');
		return product.tags || [];
	},

	removeTagFromProduct: async (userId, productId, tagId) => {
		const seller = await Seller.findOne({ where: { userId } });
		if (!seller) throw new NotFound('Seller profile not found.');

		const product = await Product.findOne({
			where: { id: productId, sellerId: seller.id },
		});
		if (!product) throw new NotFound('Product not found or access denied.');

		const result = await ProductTag.destroy({
			where: { productId: product.id, tagId },
		});
		if (result === 0) throw new NotFound('Tag not found on this product.');
	},

	getAllOrders: async (userId) => {
		const seller = await Seller.findOne({ where: { userId } });
		if (!seller) throw new NotFound('Seller profile not found.');

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

		return orders.map((order) => ({
			orderId: order.id,
			orderNumber: order.orderNumber,
			totalAmount: order.total,
			createdAt: order.createdAt,
			updatedAt: order.updatedAt,
			shippingAddress: order.shippingAddress!,
			orderItems: order.orderItems!.map((item) => ({
				itemId: item.id,
				product: item.product,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				status: item.status,
				cancelledBy: item.cancelledBy,
			})),
		}));
	},

	getAnOrder: async (userId, orderId) => {
		const seller = await Seller.findOne({ where: { userId } });
		if (!seller) throw new NotFound('Seller profile not found.');

		const orderItems = await OrderItem.findAll({
			where: { orderId, sellerId: seller.id },
			include: [
				{
					model: Order,
					include: [{ model: Address, as: 'shippingAddress' }],
				},
				Product,
			],
		});

		if (orderItems.length === 0)
			throw new NotFound('Order not found or access denied.');

		return {
			...orderItems[0].order?.toJSON(),
			items: orderItems,
		};
	},

	updateOrderStatus: async (userId, orderId, itemId, rawStatusData) => {
		const { status } = await validateWithZodSchema(
			z.object({
				status: z.enum(Object.values(OrderItemStatus) as [string, ...string[]]),
			}),
			rawStatusData,
			'Invalid status data',
		);

		const seller = await Seller.findOne({ where: { userId } });
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

	getSellerStats: async (userId) => {
		const seller = await Seller.findOne({ where: { userId } });
		if (!seller) throw new NotFound('Seller profile not found.');

		const [productCount, orderCount, totalRevenue] = await Promise.all([
			Product.count({ where: { sellerId: seller.id } }),
			OrderItem.count({ where: { sellerId: seller.id } }),
			OrderItem.sum('unitPrice', {
				where: {
					sellerId: seller.id,
					status: OrderItemStatus.DELIVERED,
				},
			}) || 0,
		]);

		return {
			sellerId: seller.id,
			storeName: seller.storeName,
			stats: {
				productCount,
				orderCount,
				totalRevenue,
			},
		};
	},
};

interface SellerService {
	getCurrentSellerProfile: (userId: string) => Promise<Seller>;
	createCurrentSellerProfile: (
		userId: string,
		rawProfileData: any,
	) => Promise<Seller>;
	deleteCurrentSellerProfile: (userId: string) => Promise<void>;
	createProduct: (userId: string, rawProductData: any) => Promise<Product>;
	getAllProducts: (userId: string) => Promise<Product[]>;
	getProductById: (productId: string) => Promise<Product>;
	updateProductById: (
		userId: string,
		productId: string,
		rawUpdateData: any,
	) => Promise<Product>;
	deleteAllProducts: (userId: string) => Promise<void>;
	deleteProductById: (userId: string, productId: string) => Promise<void>;
	searchOwnProducts: (
		userId: string,
		rawQueryParams: any,
	) => Promise<{
		total: number;
		page: number;
		limit: number;
		sort: { by: string; order: string };
		products: Product[];
	}>;
	updatePublishedStatusOfAllProducts: (
		userId: string,
		rawStatusData: any,
	) => Promise<{
		updatedCount: number;
		isPublished: boolean;
	}>;
	createProductTags: (
		userId: string,
		productId: string,
		rawTagData: any,
	) => Promise<{
		created: ProductTag[];
		skipped: ProductTag[];
	}>;
	getProductTags: (userId: string, productId: string) => Promise<Tag[]>;
	removeTagFromProduct: (
		userId: string,
		productId: string,
		tagId: string,
	) => Promise<void>;
	getAllOrders: (userId: string) => Promise<
		Array<{
			orderId: string;
			orderNumber: string;
			totalAmount: number;
			createdAt: Date;
			updatedAt: Date;
			shippingAddress: Address;
			orderItems: Array<{
				itemId: string;
				product: Product | undefined;
				quantity: number;
				unitPrice: number;
				status: OrderItemStatus;
				cancelledBy: CancellationBy;
			}>;
		}>
	>;
	getAnOrder: (userId: string, orderId: string) => Promise<any>;
	updateOrderStatus: (
		userId: string,
		orderId: string,
		itemId: string,
		rawStatusData: any,
	) => Promise<OrderItem>;
	getSellerStats: (userId: string) => Promise<{
		sellerId: string;
		storeName: string;
		stats: {
			productCount: number;
			orderCount: number;
			totalRevenue: number;
		};
	}>;
}
