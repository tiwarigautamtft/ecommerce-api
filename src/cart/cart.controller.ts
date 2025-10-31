import assert from 'assert';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { cartService } from './cart.service';

export const cartController: CartController = {
	getCart: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const cartItems = await cartService.getCart(req.user.id);
		res.status(StatusCodes.OK).json(cartItems);
	},

	addToCart: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const result = await cartService.addToCart(req.user.id, req.body);
		res.status(StatusCodes.CREATED).json(result);
	},

	updateCartItem: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const result = await cartService.updateCartItem(
			req.user.id,
			req.params.itemId,
			req.body,
		);
		res.status(StatusCodes.OK).json(result);
	},

	removeFromCart: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		await cartService.removeFromCart(req.user.id, req.params.itemId);
		res.status(StatusCodes.OK).json({ message: 'Item removed from cart.' });
	},

	clearCart: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		await cartService.clearCart(req.user.id);
		res.status(StatusCodes.OK).json({ message: 'Cart cleared.' });
	},
};

interface CartController {
	getCart: RequestHandler;
	addToCart: RequestHandler;
	updateCartItem: RequestHandler;
	removeFromCart: RequestHandler;
	clearCart: RequestHandler;
}
