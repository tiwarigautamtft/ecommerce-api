import { StatusCodes, getReasonPhrase } from 'http-status-codes';

class HttpException extends Error {
	status: number;
	error: any;
	constructor(status: number, message: string, error?: any) {
		super(message);
		this.name = this.constructor.name;
		this.status = status;
		this.error = error;
	}
}

export function createHttpException(status: number) {
	const defaultMessage = getReasonPhrase(status);
	return class extends HttpException {
		constructor(message: string = defaultMessage, error?: any) {
			super(status, message, error);
		}
	};
}

const BadRequest = createHttpException(StatusCodes.BAD_REQUEST);
const Conflict = createHttpException(StatusCodes.CONFLICT);
const InternalServerError = createHttpException(
	StatusCodes.INTERNAL_SERVER_ERROR,
);
const Forbidden = createHttpException(StatusCodes.FORBIDDEN);
const NotFound = createHttpException(StatusCodes.NOT_FOUND);
const Unauthorized = createHttpException(StatusCodes.UNAUTHORIZED);
const UnprocessableEntity = createHttpException(
	StatusCodes.UNPROCESSABLE_ENTITY,
);

export {
	BadRequest,
	Conflict,
	InternalServerError,
	Forbidden,
	NotFound,
	Unauthorized,
	UnprocessableEntity,
};
