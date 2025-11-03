import { StatusCodes } from 'http-status-codes';

import { createHttpException } from './http';

export const SequelizeUniqueConstraintError = createHttpException(
	StatusCodes.CONFLICT,
);
