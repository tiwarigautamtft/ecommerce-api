import { StatusCodes } from 'http-status-codes';

import { HttpException } from './http-exception';

export class BadRequest extends HttpException {
	constructor(message: string, error?: any) {
		super(StatusCodes.BAD_REQUEST, message, error);
	}
}
