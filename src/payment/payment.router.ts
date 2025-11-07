import { Router } from 'express';

import { paymentController } from './payment.controller';

export const paymentRouter = Router({ mergeParams: true });

paymentRouter.post('/', paymentController.makePaymentForOrder);
paymentRouter.get('/', paymentController.getAllPaymentsForOrder);
paymentRouter.get('/status', paymentController.getPaymentStatusForOrder);
paymentRouter.get('/:paymentId', paymentController.getAPaymentForOrder);
