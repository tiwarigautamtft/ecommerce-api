import { StatusCodes } from 'http-status-codes';

import { HttpException } from './http-exception';

export class Conflict extends HttpException {
	constructor(message: string, error?: any) {
		super(StatusCodes.CONFLICT, message, error);
	}
}
