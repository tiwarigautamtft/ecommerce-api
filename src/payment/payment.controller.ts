import assert from 'assert';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { PaymentStatus } from './payment-status.enum';
import { paymentService } from './payment.service';

export const paymentController: PaymentController = {
	makePaymentForOrder: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const paymentAttempt = await paymentService.makePaymentForOrder(
			req.user.id,
			req.params.orderId,
		);
		if (paymentAttempt.status === PaymentStatus.FAILURE) {
			res
				.status(StatusCodes.INTERNAL_SERVER_ERROR)
				.json({ ...paymentAttempt.toJSON(), message: 'Payment Failed' });
			return;
		}
		res.status(StatusCodes.OK).json(paymentAttempt);
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

	getPaymentStatusForOrder: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const paymentStatus = await paymentService.getPaymentStatusForOrder(
			req.user.id,
			req.params.orderId,
		);
		res.status(StatusCodes.OK).json(paymentStatus);
	},
};

interface PaymentController {
	makePaymentForOrder: RequestHandler;
	getAllPaymentsForOrder: RequestHandler;
	getAPaymentForOrder: RequestHandler;
	getPaymentStatusForOrder: RequestHandler;
}
