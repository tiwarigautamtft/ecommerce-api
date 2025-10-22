import { StatusCodes } from 'http-status-codes';

import { HttpException } from '../http';

export class SequelizeUniqueConstraintError extends HttpException {
	constructor(message: string, error?: any) {
		super(StatusCodes.CONFLICT, message, error);
	}
}
