import assert from 'assert';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { InferAttributes, Op, WhereOptions } from 'sequelize';

import { NotFound, UnprocessableEntity } from '@/lib/exceptions';

import { SearchProductDto } from './dto';
import { Product } from './product.model';

export const productController: ProductControler = {
	getProductById: async (req, res) => {
		const productId = req.params.productId;
		const product = await Product.findByPk(productId);

		if (!product) {
			throw new NotFound('Product not found');
		}

		res.status(StatusCodes.OK).json(product);
	},

	searchProducts: async (req, res) => {
		assert(req.user, 'User must be authenticated');

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

interface ProductControler {
	getProductById: RequestHandler;
	searchProducts: RequestHandler;
}
