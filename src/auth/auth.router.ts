import { Router } from 'express';

import { isAuthenticatedGuard, isGuestGuard } from '@/lib/guards';

import { authController } from '.';

export const authRouter: Router = Router();

authRouter.get('/check', authController.handleAuthCheck);

authRouter.get('/login/google', isGuestGuard, authController.handleGoogleLogin);
authRouter.get(
	'/login/google/callback',
	isGuestGuard,
	authController.handleGoogleCallback,
);
authRouter.post('/logout', isAuthenticatedGuard, authController.handleLogout);
