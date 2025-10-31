import assert from 'assert';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { RoleName } from '@/role/role.enum';

import { sellerService } from './seller.service';

export const sellerController: SellerController = {
	getCurrentSellerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const profile = await sellerService.getCurrentSellerProfile(req.user.id);
		res.status(StatusCodes.OK).json(profile);
	},

	createCurrentSellerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const result = await sellerService.createCurrentSellerProfile(
			req.user.id,
			req.body,
		);

		req.user.roles = [...(req.user.roles || []), RoleName.SELLER];
		const { userId, ...newProfile } = result.toJSON();
		res.status(StatusCodes.CREATED).json(newProfile);
	},

	deleteCurrentSellerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		await sellerService.deleteCurrentSellerProfile(req.user.id);

		req.user.roles = (req.user.roles || []).filter(
			(role) => role !== RoleName.SELLER,
		);
		res.status(StatusCodes.OK).json({ message: 'Seller profile deleted.' });
	},

	createProduct: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const product = await sellerService.createProduct(req.user.id, req.body);
		res.status(StatusCodes.CREATED).json(product);
	},

	getAllProducts: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const products = await sellerService.getAllProducts(req.user.id);
		res.status(StatusCodes.OK).json(products);
	},

	getProductById: async (req, res) => {
		const product = await sellerService.getProductById(req.params.productId);
		res.status(StatusCodes.OK).json(product);
	},

	updateProductById: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const product = await sellerService.updateProductById(
			req.user.id,
			req.params.productId,
			req.body,
		);
		res.status(StatusCodes.OK).json(product);
	},

	deleteAllProducts: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		await sellerService.deleteAllProducts(req.user.id);
		res.status(StatusCodes.OK).json({ message: 'All products deleted' });
	},

	deleteProductById: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		await sellerService.deleteProductById(req.user.id, req.params.productId);
		res.status(StatusCodes.OK).json({ message: 'Product deleted' });
	},

	searchOwnProducts: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const result = await sellerService.searchOwnProducts(
			req.user.id,
			req.query,
		);
		res.status(StatusCodes.OK).json(result);
	},

	updatePublishedStatusOfAllProducts: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const result = await sellerService.updatePublishedStatusOfAllProducts(
			req.user.id,
			req.body,
		);
		res.status(StatusCodes.OK).json({
			message: `Updated published status for ${result.updatedCount} products`,
			updatedCount: result.updatedCount,
			isPublished: result.isPublished,
		});
	},

	createProductTags: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const result = await sellerService.createProductTags(
			req.user.id,
			req.params.productId,
			req.body,
		);

		let message: string;
		if (result.created.length === 0) {
			message = `All ${result.skipped.length} tags already exist on this product.`;
		} else if (result.skipped.length > 0) {
			message = `Successfully added ${result.created.length} tags (${result.skipped.length} already existed)`;
		} else {
			message = `Successfully added ${result.created.length} tags`;
		}

		res.status(StatusCodes.OK).json({
			message,
			createdTags: result.created,
			stats: {
				created: result.created.length,
				skipped: result.skipped.length,
			},
		});
	},

	getProductTags: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const tags = await sellerService.getProductTags(
			req.user.id,
			req.params.productId,
		);
		res.status(StatusCodes.OK).json(tags);
	},

	removeTagFromProduct: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		await sellerService.removeTagFromProduct(
			req.user.id,
			req.params.productId,
			req.params.tagId,
		);
		res.status(StatusCodes.OK).json({ message: 'Tag removed from product.' });
	},

	getAllOrders: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const orders = await sellerService.getAllOrders(req.user.id);
		res.status(StatusCodes.OK).json({
			orders: orders,
			totalOrders: orders.length,
		});
	},

	getAnOrder: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const order = await sellerService.getAnOrder(
			req.user.id,
			req.params.orderId,
		);
		res.status(StatusCodes.OK).json(order);
	},

	updateOrderStatus: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const orderItem = await sellerService.updateOrderStatus(
			req.user.id,
			req.params.orderId,
			req.params.itemId,
			req.body,
		);
		res.status(StatusCodes.OK).json(orderItem);
	},
};

interface SellerController {
	getCurrentSellerProfile: RequestHandler;
	createCurrentSellerProfile: RequestHandler;
	deleteCurrentSellerProfile: RequestHandler;

	searchOwnProducts: RequestHandler;
	createProduct: RequestHandler;
	getAllProducts: RequestHandler;
	getProductById: RequestHandler;
	updateProductById: RequestHandler;
	updatePublishedStatusOfAllProducts: RequestHandler;
	deleteAllProducts: RequestHandler;
	deleteProductById: RequestHandler;

	createProductTags: RequestHandler;
	getProductTags: RequestHandler;
	removeTagFromProduct: RequestHandler;

	getAllOrders: RequestHandler;
	getAnOrder: RequestHandler;
	updateOrderStatus: RequestHandler;
}
