import { Router } from 'express';

import { paymentController } from './payment.controller';

export const paymentRouter: Router = Router();

paymentRouter.post('/:orderId/payments', paymentController.makePaymentForOrder);
paymentRouter.get(
	'/:orderId/payments',
	paymentController.getAllPaymentsForOrder,
);
paymentRouter.get(
	'/:orderId/payments/:paymentId',
	paymentController.getAPaymentForOrder,
);
