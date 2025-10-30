import { Router } from 'express';

import { isSellerGuard } from '@/lib/guards';

import { sellerController } from '.';

export const sellerRouter: Router = Router();

sellerRouter.post('/me', sellerController.createCurrentSellerProfile);
sellerRouter.get('/me', sellerController.getCurrentSellerProfile);
sellerRouter.delete(
	'/me',
	isSellerGuard,
	sellerController.deleteCurrentSellerProfile,
);

sellerRouter.get('/me/products', sellerController.searchOwnProducts);
sellerRouter.post('/me/products', sellerController.createProduct);
sellerRouter.get('/me/products/:productId', sellerController.getProductById);
sellerRouter.patch(
	'/me/products/:productId',
	sellerController.updateProductById,
);
sellerRouter.patch(
	'/me/products',
	sellerController.updatePublishedStatusOfAllProducts,
);
sellerRouter.delete(
	'/me/products/:productId',
	sellerController.deleteProductById,
);
sellerRouter.delete('/me/products', sellerController.deleteAllProducts);

sellerRouter.post(
	'/me/products/:productId/tags',
	sellerController.createProductTags,
);
sellerRouter.get(
	'/me/products/:productId/tags',
	sellerController.getProductTags,
);
sellerRouter.delete(
	'/me/products/:productId/tags/:tagId',
	sellerController.removeTagFromProduct,
);

sellerRouter.get('/me/orders', sellerController.getAllOrders);
sellerRouter.get('/me/orders/:orderId', sellerController.getAnOrder);
sellerRouter.patch('/me/order/:orderId', sellerController.updateOrderStatus);
