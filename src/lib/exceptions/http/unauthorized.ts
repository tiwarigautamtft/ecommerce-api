import { StatusCodes } from 'http-status-codes';

import { HttpException } from './http-exception';

export class Unauthorized extends HttpException {
	constructor(message: string, error?: any) {
		super(StatusCodes.UNAUTHORIZED, message, error);
	}
}
