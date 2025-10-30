import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { InferAttributes, Op, WhereOptions } from 'sequelize';
import z from 'zod';

import { BadRequest, NotFound, UnprocessableEntity } from '@/lib/exceptions';

import { SearchProductDto } from './dto';
import { Product } from './product.model';

export const productController: ProductControler = {
	getProductById: async (req, res) => {
		const validationResult = await z
			.uuid()
			.safeParseAsync(req.params.productId);

		if (validationResult.error) {
			throw new BadRequest(
				'Invalid path parameter',
				z.treeifyError(validationResult.error),
			);
		}
		const productId = validationResult.data;

		const product = await Product.findByPk(productId);

		if (!product) {
			throw new NotFound('Product not found');
		}

		res.status(StatusCodes.OK).json(product);
	},

	searchProducts: async (req, res) => {
		const validationResult = await SearchProductDto.safeParseAsync(req.query);
		if (validationResult.error) {
			throw new UnprocessableEntity(
				'Invalid query parameter',
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

interface ProductControler {
	getProductById: RequestHandler;
	searchProducts: RequestHandler;
}
