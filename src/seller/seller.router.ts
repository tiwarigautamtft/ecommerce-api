import { Router } from 'express';

import { cacheCurried } from '@/lib/middlewares/cache';
import { sec } from '@/lib/utils';

import { sellerController } from '.';

export const sellerRouter: Router = Router();

// const cacheTenSeconds = cacheCurried(sec('10 sec'));

sellerRouter.get('/profile', sellerController.getCurrentSellerProfile);
sellerRouter.delete('/profile', sellerController.deleteCurrentSellerProfile);

sellerRouter.get('/products', sellerController.searchOwnProducts);
sellerRouter.post('/products', sellerController.createProduct);
sellerRouter.get('/products/:productId', sellerController.getProductById);
sellerRouter.patch('/products/:productId', sellerController.updateProductById);
sellerRouter.delete('/products', sellerController.deleteAllProducts);
sellerRouter.delete('/products/:productId', sellerController.deleteProductById);
