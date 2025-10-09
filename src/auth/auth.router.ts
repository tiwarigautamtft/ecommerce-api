import { Router } from 'express';

import { authController } from '.';
import { isAuthenticatedGuard, isGuestGuard } from '@/lib/guards';

export const authRouter: Router = Router();

authRouter.get('/check', (req, res) => { res.send('Auth check'); });

authRouter.get('/login/google', isGuestGuard, authController.handleGoogleLogin);
authRouter.get(
	'/login/google/callback',
	isGuestGuard,
	authController.handleGoogleCallback,
);
authRouter.get('/logout', isAuthenticatedGuard, authController.handleLogout);