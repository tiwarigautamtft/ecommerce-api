import { Router } from 'express';

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

