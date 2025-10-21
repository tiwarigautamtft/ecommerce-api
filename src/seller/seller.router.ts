import { Router } from 'express';

import { sellerController } from '.';

export const sellerRouter: Router = Router();

sellerRouter.get('/profile', sellerController.getCurrentSellerProfile);
sellerRouter.delete('/profile', sellerController.deleteCurrentSellerProfile);

sellerRouter.get('/products', sellerController.searchOwnProducts);
sellerRouter.post('/products', sellerController.createProduct);
sellerRouter.get('/products/:productId', sellerController.getProductById);
sellerRouter.patch('/products/:productId', sellerController.updateProductById);
sellerRouter.delete('/products', sellerController.deleteAllProducts);
sellerRouter.delete('/products/:productId', sellerController.deleteProductById);
