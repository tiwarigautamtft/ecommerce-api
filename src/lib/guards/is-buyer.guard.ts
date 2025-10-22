import { RequestHandler } from 'express';

import { Forbidden } from '@/lib/exceptions';
import { RoleName } from '@/role';

export const isBuyerGuard: RequestHandler = (req, res, next) => {
	if (!req.user?.roles?.includes(RoleName.BUYER)) {
		throw new Forbidden('Only buyers can access this route');
	}

	next();
};
