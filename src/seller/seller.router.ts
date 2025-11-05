import { Router } from 'express';

import { isSellerGuard } from '@/lib/guards';
import { tagRouter } from '@/tag/tag.router';

import { sellerController } from './seller.controller';

export const sellerRouter = Router();
sellerRouter.post('/me', sellerController.createSellerProfile);
sellerRouter.get('/me', sellerController.getSellerProfile);
sellerRouter.delete('/me', isSellerGuard, sellerController.deleteSellerProfile);
sellerRouter.use('/me/products', isSellerGuard, getProductSubRouter());
sellerRouter.use('/me/orders', isSellerGuard, getOrderSubRouter());

function getProductSubRouter() {
	const router = Router({ mergeParams: true });
	router.get('/', sellerController.searchProducts);
	router.post('/', sellerController.createProduct);
	router.get('/:productId', sellerController.getProductById);
	router.patch('/:productId', sellerController.updateProductById);
	router.patch('/', sellerController.updatePublishedStatusOfAllProducts);
	router.delete('/:productId', sellerController.deleteProductById);
	router.delete('/', sellerController.deleteAllProducts);
	router.use('/:productId/tags', tagRouter);
	return router;
}

function getOrderSubRouter() {
	const router = Router({ mergeParams: true });
	router.get('/', sellerController.getAllOrders);
	router.get('/:orderId', sellerController.getAnOrder);
	router.patch('/:orderId', sellerController.updateOrderStatus);
	return router;
}
