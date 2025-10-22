import { RequestHandler } from 'express';

import { Forbidden } from '@/lib/exceptions';

export const isGuestGuard: RequestHandler = (req, res, next) => {
	if (req.isAuthenticated && req.isAuthenticated()) {
		throw new Forbidden('This route is for guest users only');
	}

	next();
};
