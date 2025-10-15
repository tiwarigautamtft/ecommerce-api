import { RequestHandler } from 'express';

export const isAuthenticatedGuard: RequestHandler = (req, res, next) => {
	if (req.isAuthenticated && !req.isAuthenticated()) {
		res.status(401).json({
			message: 'This route is only available for authenticated users',
		});
		return;
	}

	next();
};
