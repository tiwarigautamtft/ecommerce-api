import { Address } from '@/address';
import { OAuthAccount } from '@/auth';
import { CartItem } from '@/cart';
import { Order } from '@/order';
import { OrderItem } from '@/order';
import { PaymentAttempt } from '@/payment';
import { Product } from '@/product';
import { ProductTag } from '@/product';
import { Tag } from '@/product';
import { Role } from '@/role';
import { UserRole } from '@/role';
import { Seller } from '@/seller';
import { User } from '@/user';

export function defineAssociations() {
	const models = {
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
	};

	Object.values(models).forEach((model) => {
		if (typeof model.associate === 'function') {
			model.associate(models);
		}
	});
}
