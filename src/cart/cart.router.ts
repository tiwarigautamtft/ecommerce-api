import { Router } from 'express';

import { cartController } from './cart.controller';

export const cartRouter: Router = Router();

cartRouter.get('/', cartController.getCart);
cartRouter.post('/', cartController.addToCart);
cartRouter.put('/:itemId', cartController.updateCartItem);
cartRouter.delete('/:itemId', cartController.removeFromCart);
cartRouter.delete('/', cartController.clearCart);
