import { Router } from 'express';

import { paymentRouter } from '@/payment/payment.router';

import { orderController } from './order.controller';

export const orderRouter: Router = Router();

orderRouter.post('/checkout', orderController.placeOrder);
orderRouter.get('/', orderController.getAllOrders);
orderRouter.get('/:orderId', orderController.getOrder);
orderRouter.patch('/:orderId', orderController.cancelOrder);

orderRouter.use('/', paymentRouter);
