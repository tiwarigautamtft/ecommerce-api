import { StatusCodes } from 'http-status-codes';

import { HttpException } from './http-exception';

export class NotFound extends HttpException {
	constructor(message: string, error?: any) {
		super(StatusCodes.NOT_FOUND, message, error);
	}
}

