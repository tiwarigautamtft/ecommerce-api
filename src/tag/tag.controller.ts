import assert from 'assert';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { tagService } from './tag.service';

export const tagController: TagController = {
	createProductTags: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const result = await tagService.createProductTags(
			req.params.productId,
			req.body,
		);
		res.status(StatusCodes.CREATED).json(result);
	},

	generateProductTags: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const result = await tagService.generateProductTags(req.params.productId);
		res.status(StatusCodes.CREATED).json(result);
	},

	getAllProductTags: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const result = await tagService.getProductTags(req.params.productId);
		res.status(StatusCodes.OK).json(result);
	},

	getProductTag: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const result = await tagService.getProductTag(
			req.params.productId,
			req.params.tagId,
		);
		res.status(StatusCodes.OK).json(result);
	},

	removeProductTag: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		await tagService.removeProductTag(req.params.productId, req.params.tagId);
		res.status(StatusCodes.OK).json({ message: 'Tag removed from product.' });
	},

	removeAllProductTags: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		await tagService.removeAllProductTags(req.params.productId);
		res
			.status(StatusCodes.OK)
			.json({ message: 'All tags removed from product.' });
	},
};

interface TagController {
	createProductTags: RequestHandler;
	generateProductTags: RequestHandler;
	getAllProductTags: RequestHandler;
	getProductTag: RequestHandler;
	removeProductTag: RequestHandler;
	removeAllProductTags: RequestHandler;
}
