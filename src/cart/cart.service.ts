import { NotFound } from '@/lib/exceptions';
import { validateWithZodSchema } from '@/lib/utils';
import { Product } from '@/product/product.model';
import { productService } from '@/product/product.service';

import { CartItem } from './cart-item.model';
import { AddToCartDto, UpdateCartDto } from './dto';

export const cartService: CartService = {
	getCart: (userId) => {
		return CartItem.findAll({
			where: { userId },
			attributes: { exclude: ['userId', 'productId'] },
			include: [
				{
					model: Product,
					attributes: ['id', 'name', 'quantity', 'price'],
				},
			],
			order: [['created_at', 'DESC']],
		});
	},

	addToCart: async (userId, rawCartData) => {
		const { productId, quantity } = await validateWithZodSchema(
			AddToCartDto,
			rawCartData,
			'Invalid cart data',
		);

		// ensure the product exists
		await productService.getProductById(productId);

		const [cartItem, isNewRecord] = await CartItem.findOrCreate({
			where: { userId, productId },
			defaults: { userId, productId, quantity },
		});

		if (!isNewRecord) {
			cartItem.quantity += quantity;
			await cartItem.save();
		}

		return cartItem;
	},

	updateCartItem: async (userId, itemId, rawUpdateData) => {
		const { quantity } = await validateWithZodSchema(
			UpdateCartDto,
			rawUpdateData,
			'Invalid cart data',
		);

		const cartItem = await CartItem.findOne({
			where: { id: itemId, userId },
			attributes: { exclude: ['userId'] },
		});
		if (!cartItem) {
			throw new NotFound('Cart Item not found in your cart.');
		}

		if (cartItem.quantity !== quantity) {
			cartItem.quantity = quantity;
			await cartItem.save({ fields: ['quantity'] });
		}
		return cartItem;
	},

	removeFromCart: async (userId, itemId) => {
		const result = await CartItem.destroy({ where: { id: itemId, userId } });
		if (result === 0) throw new NotFound('Cart item not found.');
	},

	clearCart: async (userId) => {
		await CartItem.destroy({ where: { userId } });
	},

	getCartWithSummary: async (userId) => {
		const cartItems = await cartService.getCart(userId);
		const { validItems } = await cartService.validateCartItems(cartItems);

		const { total, count } = validItems.reduce(
			(sum, item) => {
				sum.total += item.quantity * item.product!.price;
				sum.count += item.quantity;
				return sum;
			},
			{ total: 0, count: 0 },
		);

		return {
			items: validItems,
			summary: {
				total,
				productsCount: validItems.length,
				itemsCount: count,
			},
		};
	},

	validateCartItems: async (cartItems) => {
		const invalidItems: CartItem[] = [];
		const validItems: CartItem[] = [];
		cartItems.forEach((cartItem) => {
			const product = cartItem.product;
			if (!product || product.quantity < cartItem.quantity) {
				invalidItems.push(cartItem);
			} else {
				validItems.push(cartItem);
			}
		});

		return {
			validItems,
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
	getCartWithSummary: (userId: string) => Promise<{
		items: CartItem[];
		summary: { total: number; productsCount: number; itemsCount: number };
	}>;
	validateCartItems: (
		cartItems: CartItem[],
	) => Promise<{ validItems: CartItem[]; invalidItems: CartItem[] }>;
}
