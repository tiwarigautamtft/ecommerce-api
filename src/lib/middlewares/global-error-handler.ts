import { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

export const globalErrorHandler: ErrorRequestHandler = (
	error,
	req,
	res,
	next,
) => {
	console.error(error.stack);

	res
		.status(
			error.status || error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
		)
		.json({
			message: error.message || 'Internal Server Error',
			error: error?.error,
		});
};
