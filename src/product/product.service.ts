import { Op } from 'sequelize';
import z from 'zod';

import { NotFound, UnprocessableEntity } from '@/lib/exceptions';
import { validateWithZodSchema } from '@/lib/utils';
import { Seller } from '@/seller/seller.model';

import { SearchProductDto } from './dto';
import { Product } from './product.model';
import { Tag } from './tag.model';

export const productService: ProductService = {
	getProductById: async (rawProductId) => {
		const productId = await validateWithZodSchema(
			z.uuid(),
			rawProductId,
			'Invalid product ID',
		);
		const product = await Product.findByPk(productId);
		if (!product) throw new NotFound('Product not found');
		return product;
	},

	searchProducts: async (rawQueryParams: any) => {
		const data = await validateWithZodSchema(
			SearchProductDto,
			rawQueryParams,
			'Invalid query parameter(s)',
		);

		const whereClause = {
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
		};

		const { rows: products, count } = await Product.findAndCountAll({
			limit: data.limit,
			offset: (data.page - 1) * data.limit,
			where: whereClause,
			order: [[data.sortBy, data.sortOrder.toUpperCase()]],
		});

		return {
			total: count,
			page: data.page,
			limit: data.limit,
			products,
		};
	},

	getProductWithDetails: async (productId) => {
		const product = await Product.findByPk(productId, {
			include: [
				{ model: Seller, attributes: ['id', 'storeName'] },
				{ model: Tag, as: 'tags', through: { attributes: [] } },
			],
		});

		if (!product) throw new NotFound('Product not found');
		return product;
	},

	getProductsBySeller: (sellerId) => {
		return Product.findAll({
			where: { sellerId },
			include: [{ model: Tag, as: 'tags', through: { attributes: [] } }],
		});
	},

	getFeaturedProducts: (limit = 10) => {
		return Product.findAll({
			where: { isPublished: true },
			order: [['createdAt', 'DESC']],
			limit,
			include: [{ model: Seller, attributes: ['storeName'] }],
		});
	},

	updateProductInventory: async (productId, quantityChange) => {
		const product = await Product.findByPk(productId);
		if (!product) throw new NotFound('Product not found');

		const newQuantity = product.quantity + quantityChange;
		if (newQuantity < 0) {
			throw new UnprocessableEntity('Insufficient inventory.');
		}

		await product.update({ quantity: newQuantity });
		return product;
	},
};

interface ProductService {
	getProductById: (productId: string) => Promise<Product>;
	searchProducts: (rawQueryParams: any) => Promise<{
		total: number;
		page: number;
		limit: number;
		products: Product[];
	}>;
	getProductWithDetails: (productId: string) => Promise<Product>;
	getProductsBySeller: (sellerId: string) => Promise<Product[]>;
	getFeaturedProducts: (limit?: number) => Promise<Product[]>;
	updateProductInventory: (
		productId: string,
		quantityChange: number,
	) => Promise<Product>;
}
