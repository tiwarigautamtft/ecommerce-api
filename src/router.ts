import { Router } from 'express';

import { authRouter } from '@/auth';
import { isAuthenticatedGuard, isGuestGuard } from '@/lib/guards';
import { isSellerGuard } from '@/lib/guards';
import {
	apiRateLimit,
	authRateLimit,
	globalRateLimit,
} from '@/lib/middlewares/rate-limiter';
import { sellerRouter } from '@/seller';
import { userRouter } from '@/user';

const router: Router = Router();

router.use(globalRateLimit);
router.get('/', (_, res) => res.send('check'));
router.use('/api/auth', authRateLimit, authRouter);
router.use('/api/users', isAuthenticatedGuard, apiRateLimit, userRouter);
router.use(
	'/api/sellers',
	isAuthenticatedGuard,
	isSellerGuard,
	apiRateLimit,
	sellerRouter,
);

export default router;
