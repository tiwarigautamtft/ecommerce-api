import { Router } from 'express';

import { addressRouter } from '@/address/address.router';
import { cartRouter } from '@/cart/cart.router';
import { orderRouter } from '@/order/order.router';

import { userController } from './user.controller';

export const userRouter: Router = Router();

userRouter.get('/me', userController.getCurrentUser);
userRouter.delete('/me', userController.deleteCurrentUser);

userRouter.use('/me/addresses', addressRouter);
userRouter.use('/me/cart', cartRouter);
userRouter.use('/me/orders', orderRouter);
