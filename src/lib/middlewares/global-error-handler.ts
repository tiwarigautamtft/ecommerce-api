import { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

export const globalErrorHandler: ErrorRequestHandler = (
	err,
	req,
	res,
	next,
) => {
	console.log(err.name);
	console.error(err.stack);

	res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
		message: err.message || 'Internal Server Error',
	});
};
