import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

export const isGuestGuard: RequestHandler = (req, res, next) => {
	if (req.isAuthenticated && req.isAuthenticated()) {
		res
			.status(StatusCodes.FORBIDDEN)
			.json({ message: 'This route is for guest users only' });
		return;
	}

	next();
};
