import { Router } from 'express';

import { cacheCurried } from '@/lib/middlewares/cache';
import { sec } from '@/lib/utils';

import { sellerController } from '.';

export const sellerRouter: Router = Router();

const cacheTwoMin = cacheCurried(sec('2 min'));

sellerRouter.get(
	'/profile',
	cacheTwoMin('seller:'),
	sellerController.getCurrentSellerProfile,
);
sellerRouter.delete('/profile', sellerController.deleteCurrentSellerProfile);
