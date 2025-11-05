import { Router } from 'express';

import { isAuthenticatedGuard } from '@/lib/guards';

import { productController } from './product.controller';

export const productRouter: Router = Router();

productRouter.get('/', productController.searchProducts);
productRouter.get(
	'/feed',
	isAuthenticatedGuard,
	productController.getRecommendedFeed,
);
productRouter.get('/:productId', productController.getProductById);
