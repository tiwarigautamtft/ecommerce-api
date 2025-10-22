import { StatusCodes } from 'http-status-codes';

import { HttpException } from './http-exception';

export class UnprocessableEntity extends HttpException {
	constructor(message: string, error?: any) {
		super(StatusCodes.UNPROCESSABLE_ENTITY, message, error);
	}
}
