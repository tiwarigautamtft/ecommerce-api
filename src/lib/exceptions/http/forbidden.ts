import { StatusCodes } from 'http-status-codes';

import { HttpException } from './http-exception';

export class Forbidden extends HttpException {
	constructor(message: string, error?: any) {
		super(StatusCodes.FORBIDDEN, message, error);
	}
}
