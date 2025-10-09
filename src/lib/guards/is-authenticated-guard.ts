import { RequestHandler } from 'express';

export const isAuthenticatedGuard: RequestHandler = (req, res, next) => {
	if (req.isAuthenticated && !req.isAuthenticated()) {
		return res
			.status(403)
			.json({ message: 'You need to login to see this route' });
	}

	return next();
};