import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { productService } from './product.service';

export const productController: ProductControler = {
	getProductById: async (req, res) => {
		const product = await productService.getProductById(req.params.productId);
		res.status(StatusCodes.OK).json(product);
	},

	searchProducts: async (req, res) => {
		const result = await productService.searchProducts(req.query);
		res.status(StatusCodes.OK).json(result);
	},
};

interface ProductControler {
	getProductById: RequestHandler;
	searchProducts: RequestHandler;
}
