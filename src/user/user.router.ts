import { Router } from 'express';

import { cacheCurried } from '@/lib/middlewares/cache';
import { sec } from '@/lib/utils';

import { userController } from '.';

export const userRouter: Router = Router();

// const cacheTenSeconds = cacheCurried(sec('10 sec'));

userRouter.get('/me/profile', userController.getCurrentUser);
userRouter.delete('/me/profile', userController.deleteCurrentUser);

userRouter.get('/me/profile/seller', userController.getCurrentSellerProfile);
userRouter.post(
	'/me/profile/seller',
	userController.createCurrentSellerProfile,
);
userRouter.delete(
	'/me/profile/seller',
	userController.deleteCurrentSellerProfile,
);

userRouter.get('/me/profile/buyer', userController.getCurrentBuyerProfile);
userRouter.post('/me/profile/buyer', userController.createCurrentBuyerProfile);
userRouter.delete(
	'/me/profile/buyer',
	userController.deleteCurrentBuyerProfile,
);
