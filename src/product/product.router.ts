import { Router } from 'express';

import { productController } from '.';

export const productRouter: Router = Router();

productRouter.get('/', productController.searchProducts);
productRouter.get('/:productId', productController.getProductById);
