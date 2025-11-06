import { Router } from 'express';

import { cartController } from './cart.controller';

export const cartRouter: Router = Router();

cartRouter.get('/', cartController.getCart);
cartRouter.delete('/', cartController.clearCart);
cartRouter.post('/items', cartController.addToCart);
cartRouter.put('/items/:itemId', cartController.updateCartItem);
cartRouter.delete('/items/:itemId', cartController.removeFromCart);
