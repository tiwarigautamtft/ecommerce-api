import assert from 'assert';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { paymentService } from './payment.service';

export const paymentController: PaymentController = {
	makePaymentForOrder: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const paymentAttempt = await paymentService.makePaymentForOrder(
			req.user.id,
			req.params.orderId,
			req.body,
		);
		res.status(StatusCodes.CREATED).json(paymentAttempt);
	},

	getAllPaymentsForOrder: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const paymentAttempts = await paymentService.getAllPaymentsForOrder(
			req.user.id,
			req.params.orderId,
		);
		res.status(StatusCodes.OK).json(paymentAttempts);
	},

	getAPaymentForOrder: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const paymentAttempt = await paymentService.getAPaymentForOrder(
			req.user.id,
			req.params.orderId,
			req.params.paymentId,
		);
		res.status(StatusCodes.OK).json(paymentAttempt);
	},
};

interface PaymentController {
	makePaymentForOrder: RequestHandler;
	getAllPaymentsForOrder: RequestHandler;
	getAPaymentForOrder: RequestHandler;
}
