import { RequestHandler } from 'express';

import { RoleName } from '@/role';

export const isSellerGuard: RequestHandler = (req, res, next) => {
	if (!req.user?.roles?.includes(RoleName.SELLER)) {
		res.status(403).json({ message: 'Only sellers can access this route' });
		return;
	}

	next();
};
