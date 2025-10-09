import { Router } from 'express';

import { cacheCurried } from '@/lib/middlewares/cache';
import { sec } from '@/lib/utils';

import { userController } from '.';

export const userRouter: Router = Router();

const cacheTwoMin = cacheCurried(sec('2 min'));

userRouter.get(
	'/profile',
	cacheTwoMin('user:'),
	userController.getCurrentUserProfile,
);
userRouter.get('/:id', userController.getUser);
userRouter.patch('/:id', userController.updateUser);
userRouter.delete('/:id', userController.deleteUser);
