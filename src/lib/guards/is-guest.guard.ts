import { RequestHandler } from 'express';

export const isGuestGuard: RequestHandler = (req, res, next) => {
	if (req.isAuthenticated && req.isAuthenticated()) {
		res.status(403).json({ message: 'This route is for guest users only' });
		return;
	}

	next();
};
