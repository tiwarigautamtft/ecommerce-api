import z from 'zod';

import {
	Forbidden,
	InternalServerError,
	NotFound,
	SequelizeUniqueConstraintError,
	UnprocessableEntity,
} from '@/lib/exceptions';
import { Product } from '@/product/product.model';

import { CartItem } from './cart-item.model';
import { AddToCartDto, UpdateCartDto } from './dto';

export const cartService: CartService = {
	getCart: (userId) => {
		return CartItem.findAll({
			where: { userId },
			include: [
				{
					model: Product,
					as: 'product',
					attributes: ['id', 'name', 'description', 'price'],
				},
			],
		});
	},

	addToCart: async (userId, rawCartData) => {
		const validationResult = await AddToCartDto.safeParseAsync(rawCartData);
		if (validationResult.error) {
			throw new UnprocessableEntity(
				'Invalid cart data.',
				z.treeifyError(validationResult.error),
			);
		}

		const { productId, quantity } = validationResult.data;

		const product = await Product.findByPk(productId);
		if (!product) {
			throw new NotFound('Product not found.');
		}

		try {
			const [cartItem] = await CartItem.findOrCreate({
				where: { userId, productId },
				defaults: { quantity },
			});

			if (!cartItem.isNewRecord) {
				cartItem.quantity += quantity;
				await cartItem.save();
			}

			return cartItem;
		} catch (error) {
			if ((error as any).name === 'SequelizeUniqueConstraintError') {
				throw new SequelizeUniqueConstraintError('Product already in cart.');
			}
			throw new InternalServerError('Could not add to cart.');
		}
	},

	updateCartItem: async (userId, itemId, rawUpdateData) => {
		const validationResult = await UpdateCartDto.safeParseAsync(rawUpdateData);
		if (validationResult.error) {
			throw new UnprocessableEntity(
				'Invalid cart data.',
				z.treeifyError(validationResult.error),
			);
		}

		const { quantity } = validationResult.data;

		const cartItem = await CartItem.findByPk(itemId);
		if (!cartItem) {
			throw new NotFound('Cart Item not found.');
		}

		if (cartItem.userId !== userId) {
			throw new Forbidden('Forbidden. This item is not in your cart.');
		}

		cartItem.quantity = quantity;
		await cartItem.save();
		return cartItem;
	},

	removeFromCart: async (userId, itemId) => {
		const result = await CartItem.destroy({ where: { id: itemId, userId } });
		if (result === 0) {
			throw new NotFound('Cart item not found.');
		}
	},

	clearCart: async (userId) => {
		await CartItem.destroy({ where: { userId } });
	},

	getCartWithTotals: async (userId) => {
		const cartItems = await cartService.getCart(userId);

		const total = cartItems.reduce((sum, item) => {
			return sum + item.quantity * item.product.price;
		}, 0);

		const itemCount = cartItems.reduce((count, item) => {
			return count + item.quantity;
		}, 0);

		return {
			items: cartItems,
			summary: {
				total,
				itemCount,
				itemsCount: cartItems.length,
			},
		};
	},

	validateCartItems: async (userId) => {
		const cartItems = await CartItem.findAll({
			where: { userId },
			include: [Product],
		});

		const validationResults = cartItems.map((cartItem) => {
			const product = cartItem.Product;
			return {
				cartItemId: cartItem.id,
				productId: product.id,
				productName: product.name,
				requestedQuantity: cartItem.quantity,
				availableQuantity: product.quantity,
				isValid: product.quantity >= cartItem.quantity,
				price: product.price,
			};
		});

		const allValid = validationResults.every((result) => result.isValid);
		const invalidItems = validationResults.filter((result) => !result.isValid);

		return {
			allValid,
			validationResults,
			invalidItems,
		};
	},
};

interface CartService {
	getCart: (userId: string) => Promise<CartItem[]>;
	addToCart: (userId: string, rawCartData: any) => Promise<CartItem>;
	updateCartItem: (
		userId: string,
		itemId: string,
		rawUpdateData: any,
	) => Promise<CartItem>;
	removeFromCart: (userId: string, itemId: string) => Promise<void>;
	clearCart: (userId: string) => Promise<void>;
	getCartWithTotals: (userId: string) => Promise<{
		items: CartItem[];
		summary: { total: number; itemCount: number; itemsCount: number };
	}>;
	validateCartItems: (userId: string) => Promise<{
		allValid: boolean;
		validationResults: Array<{
			cartItemId: string;
			productId: string;
			productName: string;
			requestedQuantity: number;
			availableQuantity: number;
			isValid: boolean;
			price: number;
		}>;
		invalidItems: Array<any>;
	}>;
}
