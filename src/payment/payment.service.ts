import sequelize, { Op } from 'sequelize';

import { BadRequest, NotFound } from '@/lib/exceptions';
import { Order } from '@/order/order.model';

import { PaymentStatus } from './payment-status.enum';
import { PaymentAttempt } from './payment.model';

export const paymentService: PaymentService = {
	makePaymentForOrder: async (userId, orderId) => {
		const order = await Order.findOne({
			where: { id: orderId, userId },
			attributes: ['id', 'total'],
			include: [
				{
					model: PaymentAttempt,
					attributes: ['status'],
					where: { status: { [Op.ne]: PaymentStatus.FAILURE } },
					order: [['created_at', 'DESC']],
				},
			],
		});
		if (!order) throw new NotFound('Order not found.');

		if (order.paymentAttempts?.length !== 0) {
			throw new BadRequest(`Payment already done for this order.`, {
				paymentStatus: order.paymentAttempts![0].status,
			});
		}

		const isSuccess = Math.random() > 0.3;
		const mockPaymentStatus = isSuccess
			? PaymentStatus.SUCCESS
			: PaymentStatus.FAILURE;

		const paymentAttempt = await PaymentAttempt.create({
			orderId: order.id,
			amount: order.total,
			status: mockPaymentStatus,
		});

		// 1 sec delay to simulate a payment
		await new Promise((resolve) => setTimeout(resolve, 1000));
		return paymentAttempt;
	},

	getAllPaymentsForOrder: async (userId, orderId) => {
		const order = await Order.findOne({
			where: { id: orderId, userId },
			attributes: ['id'],
		});
		if (!order) throw new NotFound('Order not found.');

		return PaymentAttempt.findAll({
			where: { orderId: order.id },
			order: [['created_at', 'DESC']],
		});
	},

	getAPaymentForOrder: async (userId, orderId, paymentId) => {
		const order = await Order.findOne({ where: { id: orderId, userId } });
		if (!order) throw new NotFound('Order not found.');

		const paymentAttempt = await PaymentAttempt.findOne({
			where: { id: paymentId, orderId: order.id },
		});

		if (!paymentAttempt) throw new NotFound('Payment attempt not found.');
		return paymentAttempt;
	},

	getPaymentStatusForOrder: async (userId, orderId) => {
		const order = await Order.findOne({ where: { id: orderId, userId } });
		if (!order) throw new NotFound('Order not found.');

		const latestPayment = await PaymentAttempt.findOne({
			where: { orderId: order.id },
			order: [['created_at', 'DESC']],
		});

		if (!latestPayment) {
			return { paymentStatus: 'No payments made yet.' };
		}

		return { paymentStatus: latestPayment.status };
	},
};

interface PaymentService {
	makePaymentForOrder: (
		userId: string,
		orderId: string,
	) => Promise<PaymentAttempt>;
	getAllPaymentsForOrder: (
		userId: string,
		orderId: string,
	) => Promise<PaymentAttempt[]>;
	getAPaymentForOrder: (
		userId: string,
		orderId: string,
		paymentId: string,
	) => Promise<PaymentAttempt>;
	getPaymentStatusForOrder: (
		userId: string,
		orderId: string,
	) => Promise<{
		paymentStatus: string;
	}>;
}
