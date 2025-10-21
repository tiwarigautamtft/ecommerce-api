import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { RoleName } from '@/role';

export const isBuyerGuard: RequestHandler = (req, res, next) => {
	if (!req.user?.roles?.includes(RoleName.BUYER)) {
		res
			.status(StatusCodes.FORBIDDEN)
			.json({ message: 'Only buyers can access this route' });
		return;
	}

	next();
};
