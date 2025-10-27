import { Router } from 'express';

import { authController, authRouter } from '@/auth';
import { isAuthenticatedGuard } from '@/lib/guards';
import { isSellerGuard } from '@/lib/guards';
import {
	apiRateLimit,
	authRateLimit,
	globalRateLimit,
} from '@/lib/middlewares/rate-limiter';
import { productRouter } from '@/product';
import { sellerRouter } from '@/seller';
import { userRouter } from '@/user';

const router: Router = Router();

router.use(globalRateLimit);
router.get('/', authController.handleAuthCheck);
router.use('/api/auth', authRateLimit, authRouter);
router.use('/api/users', isAuthenticatedGuard, apiRateLimit, userRouter);
router.use(
	'/api/seller',
	isAuthenticatedGuard,
	isSellerGuard,
	apiRateLimit,
	sellerRouter,
);
router.use('/api/products', apiRateLimit, productRouter);

export default router;
