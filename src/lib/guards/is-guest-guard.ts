import { RequestHandler } from 'express';

export const isGuestGuard: RequestHandler = (req, res, next) => {
	if (req.isAuthenticated && req.isAuthenticated()) {
		return res.status(403).json({ message: 'Already authenticated' });
	}

	return next();
};