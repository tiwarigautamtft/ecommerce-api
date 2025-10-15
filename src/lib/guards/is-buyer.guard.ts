import { RequestHandler } from 'express';

import { RoleName } from '@/role';

export const isBuyerGuard: RequestHandler = (req, res, next) => {
	if (!req.user?.roles?.includes(RoleName.BUYER)) {
		res.status(403).json({ message: 'Only buyers can access this route' });
		return;
	}

	next();
};
