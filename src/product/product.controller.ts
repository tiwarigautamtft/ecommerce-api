import assert from 'assert';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { emitter } from '@/lib/events/emitter';

import { ProductEvent } from './product.event';
import { productService } from './product.service';

export const productController: ProductControler = {
	getProductById: async (req, res) => {
		const product = await productService.getProductById(req.params.productId);
		emitter.emit(ProductEvent.PRODUCT_VIEWED, req.user?.id, product);
		res.status(StatusCodes.OK).json(product);
	},

	searchProducts: async (req, res) => {
		const result = await productService.searchProducts(req.query);
		res.status(StatusCodes.OK).json(result);
	},

	getRecommendedFeed: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const result = await productService.getRecommendedProducts(
			req.user.id,
			req.params,
		);
		res.status(StatusCodes.OK).json(result);
	},
};

interface ProductControler {
	getProductById: RequestHandler;
	searchProducts: RequestHandler;
	getRecommendedFeed: RequestHandler;
}
