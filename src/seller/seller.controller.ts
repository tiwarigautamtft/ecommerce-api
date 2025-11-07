import assert from 'assert';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { orderService } from '@/order/order.service';
import { productService } from '@/product/product.service';
import { RoleName } from '@/role/role.enum';

import { sellerService } from './seller.service';

export const sellerController: SellerController = {
	getSellerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const profile = await sellerService.getSellerProfile(req.user.id);
		res.status(StatusCodes.OK).json(profile);
	},

	createSellerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const result = await sellerService.createSellerProfile(
			req.user.id,
			req.body,
		);

		req.user.roles.push(RoleName.SELLER);
		const { userId, ...newProfile } = result.toJSON();
		res.status(StatusCodes.CREATED).json(newProfile);
	},

	deleteSellerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		await sellerService.deleteSellerProfile(req.user.id);

		req.user.roles = (req.user.roles || []).filter(
			(role) => role !== RoleName.SELLER,
		);
		res.status(StatusCodes.OK).json({ message: 'Seller profile deleted.' });
	},

	createProduct: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const product = await productService.createProductForSeller(
			req.user.id,
			req.body,
		);
		res.status(StatusCodes.CREATED).json(product);
	},

	getAllProducts: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const products = await productService.getAllProductsBySeller(req.user.id);
		res.status(StatusCodes.OK).json(products);
	},

	getProductById: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const product = await productService.getProductBySeller(
			req.user.id,
			req.params.productId,
		);
		res.status(StatusCodes.OK).json(product);
	},

	updateProductById: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const product = await productService.updateProductBySeller(
			req.user.id,
			req.params.productId,
			req.body,
		);
		res.status(StatusCodes.OK).json(product);
	},

	deleteAllProducts: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		await productService.deleteAllProductsBySeller(req.user.id);
		res.status(StatusCodes.OK).json({ message: 'All products deleted' });
	},

	deleteProductById: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		await productService.deleteProductBySeller(
			req.user.id,
			req.params.productId,
		);
		res.status(StatusCodes.OK).json({ message: 'Product deleted' });
	},

	searchProducts: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const result = await productService.searchProductsBySeller(
			req.user.id,
			req.query,
		);
		res.status(StatusCodes.OK).json(result);
	},

	updatePublishedStatusOfAllProducts: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const result = await productService.updatePublishedStatusBySeller(
			req.user.id,
			req.body,
		);
		res.status(StatusCodes.OK).json({
			message: `Updated published status for ${result.updatedCount} products`,
			updatedCount: result.updatedCount,
			isPublished: result.isPublished,
		});
	},

	getAllOrders: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const orders = await orderService.getAllOrdersBySeller(req.user.id);
		res.status(StatusCodes.OK).json({
			totalOrders: orders.length,
			orders: orders,
		});
	},

	getAnOrder: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const order = await orderService.getOrderBySeller(
			req.user.id,
			req.params.orderId,
		);
		res.status(StatusCodes.OK).json(order);
	},

	updateOrderStatus: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const orderItem = await orderService.updateOrderStatusBySeller(
			req.user.id,
			req.params.orderId,
			req.params.itemId,
			req.body,
		);
		res.status(StatusCodes.OK).json(orderItem);
	},
};

interface SellerController {
	getSellerProfile: RequestHandler;
	createSellerProfile: RequestHandler;
	deleteSellerProfile: RequestHandler;

	createProduct: RequestHandler;
	getAllProducts: RequestHandler;
	getProductById: RequestHandler;
	updateProductById: RequestHandler;
	deleteAllProducts: RequestHandler;
	deleteProductById: RequestHandler;
	searchProducts: RequestHandler;
	updatePublishedStatusOfAllProducts: RequestHandler;

	getAllOrders: RequestHandler;
	getAnOrder: RequestHandler;
	updateOrderStatus: RequestHandler;
}
