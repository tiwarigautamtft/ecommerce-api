import { Router } from 'express';

import { authController } from '@/auth/auth.controller';
import { isAuthenticatedGuard } from '@/lib/guards';
import {
	apiRateLimit,
	authRateLimit,
	globalRateLimit,
} from '@/lib/middlewares/rate-limiter';

import { authRouter } from './auth/auth.router';
import { productRouter } from './product/product.router';
import { sellerRouter } from './seller/seller.router';
import { userRouter } from './user/user.router';

const router: Router = Router();

router.use(globalRateLimit);
router.get('/', authController.handleAuthCheck);
router.use('/api/auth', authRateLimit, authRouter);
router.use('/api/users', isAuthenticatedGuard, apiRateLimit, userRouter);
router.use('/api/sellers', isAuthenticatedGuard, apiRateLimit, sellerRouter);
router.use('/api/products', apiRateLimit, productRouter);

export default router;
