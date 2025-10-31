import { RequestHandler } from 'express';

import { Forbidden } from '@/lib/exceptions';
import { RoleName } from '@/role/role.enum';

export const isSellerGuard: RequestHandler = (req, res, next) => {
	if (!req.user?.roles?.includes(RoleName.SELLER)) {
		throw new Forbidden('Only sellers can access this route');
	}

	next();
};
