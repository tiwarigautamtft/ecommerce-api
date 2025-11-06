import assert from 'assert';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { orderService } from './order.service';

export const orderController: OrderController = {
	placeOrder: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const order = await orderService.placeOrder(req.user.id, req.body);
		res.status(StatusCodes.CREATED).json(order);
	},

	getAllOrders: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const orders = await orderService.getAllOrders(req.user.id);
		res.status(StatusCodes.OK).json(orders);
	},

	getOrder: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const order = await orderService.getOrder(req.user.id, req.params.orderId);
		res.status(StatusCodes.OK).json(order);
	},

	cancelOrder: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const order = await orderService.cancelOrder(
			req.user.id,
			req.params.orderId,
		);
		res.status(StatusCodes.OK).json(order);
	},

	getOrderStatus: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const status = await orderService.getOrderStatus(req.params.orderId);
		res.status(StatusCodes.OK).json(status);
	},
};

interface OrderController {
	placeOrder: RequestHandler;
	getAllOrders: RequestHandler;
	getOrder: RequestHandler;
	cancelOrder: RequestHandler;
	getOrderStatus: RequestHandler;
}
