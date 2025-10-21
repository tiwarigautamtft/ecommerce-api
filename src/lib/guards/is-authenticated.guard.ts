import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

export const isAuthenticatedGuard: RequestHandler = (req, res, next) => {
	if (req.isAuthenticated && !req.isAuthenticated()) {
		res.status(StatusCodes.UNAUTHORIZED).json({
			message: 'This route is only available for authenticated users',
		});
		return;
	}

	next();
};
