import { RequestHandler } from 'express';

import { Unauthorized } from '@/lib/exceptions';

export const isAuthenticatedGuard: RequestHandler = (req, res, next) => {
	if (req.isAuthenticated && !req.isAuthenticated()) {
		throw new Unauthorized(
			'This route is only available for authenticated users',
		);
	}

	next();
};
