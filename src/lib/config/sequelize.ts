import { Sequelize } from 'sequelize-typescript';

import { Address } from '@/address/address.model';
import { OAuthAccount } from '@/auth/auth.model';
import { CartItem } from '@/cart/cart-item.model';
import { OrderItem } from '@/order/order-item.model';
import { Order } from '@/order/order.model';
import { PaymentAttempt } from '@/payment/payment.model';
import { ProductTag } from '@/product/product-tag.model';
import { Product } from '@/product/product.model';
import { Tag } from '@/product/tag.model';
import { Role } from '@/role/role.model';
import { Seller } from '@/seller/seller.model';
import { UserRole } from '@/user/user-role.model';
import { User } from '@/user/user.model';

import { env } from './env';

export const sequelize = new Sequelize(env.DB_URL, {
	models: [
		Address,
		User,
		OAuthAccount,
		Role,
		UserRole,
		Seller,
		Product,
		Tag,
		ProductTag,
		CartItem,
		Order,
		OrderItem,
		PaymentAttempt,
	],
});

export const devSync = async (s: Sequelize) => {
	try {
		await s.authenticate();
		console.log('Database connection setup successfully!');

		if (env.isDev) {
			try {
				await s.sync({ alter: true, logging: false });
				console.log('Database sync successful');
			} catch (error) {
				console.error("Couldn't sync database", error);
			}
		}
	} catch (error) {
		console.error('Unable to connect to the database', error);
	}
};
