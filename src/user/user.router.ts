import { Router } from 'express';

import { buyerController } from '@/buyer';
import { sellerController } from '@/seller';

import { userController } from '.';

export const userRouter: Router = Router();

userRouter.get('/me/profile', userController.getCurrentUser);
userRouter.delete('/me/profile', userController.deleteCurrentUser);

userRouter.get('/me/profile/seller', sellerController.getCurrentSellerProfile);
userRouter.post(
	'/me/profile/seller',
	sellerController.createCurrentSellerProfile,
);
userRouter.delete(
	'/me/profile/seller',
	sellerController.deleteCurrentSellerProfile,
);

userRouter.get('/me/profile/buyer', buyerController.getCurrentBuyerProfile);
userRouter.post('/me/profile/buyer', buyerController.createCurrentBuyerProfile);
userRouter.delete(
	'/me/profile/buyer',
	buyerController.deleteCurrentBuyerProfile,
);
