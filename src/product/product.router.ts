import { Router } from 'express';

import { productController } from './product.controller';

export const productRouter: Router = Router();

productRouter.get('/', productController.searchProducts);
productRouter.get('/:productId', productController.getProductById);
