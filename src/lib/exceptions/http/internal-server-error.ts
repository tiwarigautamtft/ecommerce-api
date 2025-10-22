import { StatusCodes } from 'http-status-codes';

import { HttpException } from './http-exception';

export class InternalServerError extends HttpException {
	constructor(message: string, error?: any) {
		super(StatusCodes.INTERNAL_SERVER_ERROR, message, error);
	}
}
