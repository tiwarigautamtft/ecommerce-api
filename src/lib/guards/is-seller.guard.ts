import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { RoleName } from '@/role';

export const isSellerGuard: RequestHandler = (req, res, next) => {
	if (!req.user?.roles?.includes(RoleName.SELLER)) {
		res
			.status(StatusCodes.FORBIDDEN)
			.json({ message: 'Only sellers can access this route' });
		return;
	}

	next();
};
