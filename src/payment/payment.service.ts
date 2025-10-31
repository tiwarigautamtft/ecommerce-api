import sequelize from 'sequelize';

import { NotFound } from '@/lib/exceptions';
import { validateWithZodSchema } from '@/lib/utils';
import { Order } from '@/order/order.model';
import { CreatePaymentDto } from '@/user/dto';

import { PaymentStatus } from './payment-status.enum';
import { PaymentAttempt } from './payment.model';

export const paymentService: PaymentService = {
	makePaymentForOrder: async (userId, orderId, rawPaymentData) => {
		const { amount } = await validateWithZodSchema(
			CreatePaymentDto,
			rawPaymentData,
			'Invalid payment data',
		);

		const order = await Order.findOne({ where: { id: orderId, userId } });
		if (!order) throw new NotFound('Order not found.');

		const isSuccess = Math.random() > 0.3;
		const mockPaymentStatus = isSuccess
			? PaymentStatus.SUCCESS
			: PaymentStatus.FAILURE;

		const paymentAttempt = await PaymentAttempt.create({
			orderId: order.id,
			amount,
			status: mockPaymentStatus,
		});

		await new Promise((resolve) => setTimeout(resolve, 1000));
		return paymentAttempt;
	},

	getAllPaymentsForOrder: async (userId, orderId) => {
		const order = await Order.findOne({ where: { id: orderId, userId } });
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

	getPaymentStats: async (userId) => {
		const orders = await Order.findAll({ where: { userId } });
		const orderIds = orders.map((order) => order.id);

		const payments = await PaymentAttempt.findAll({
			where: { orderId: orderIds },
			attributes: ['status', [sequelize.fn('COUNT', '*'), 'count']],
			group: ['status'],
		});

		const totalAmount = await PaymentAttempt.sum('amount', {
			where: { orderId: orderIds, status: PaymentStatus.SUCCESS },
		});

		return {
			totalOrders: orders.length,
			paymentStats: payments.reduce((acc, payment) => {
				acc[payment.status] = parseInt(payment.get('count') as string);
				return acc;
			}, {}),
			totalRevenue: totalAmount || 0,
		};
	},
};

interface PaymentService {
	makePaymentForOrder: (
		userId: string,
		orderId: string,
		rawPaymentData: any,
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
	getPaymentStats: (userId: string) => Promise<{
		totalOrders: number;
		paymentStats: Record<string, number>;
		totalRevenue: number;
	}>;
}
