import { OAuthAccount } from '@/auth/auth.model';
import { CartItem } from '@/cart/cart_item.model';
import { Invoice } from '@/invoice/invoice.model';
import { Order } from '@/order/order.model';
import { OrderItem } from '@/order/order_item.model';
import { Product } from '@/product/product.model';
import { ProductTag } from '@/product/product_tag.model';
import { Tag } from '@/product/tag.model';
import { Role } from '@/role/role.model';
import { UserRole } from '@/role/user_role.model';
import { Seller } from '@/seller/seller.model';
import { User } from '@/user/user.model';

export function defineAssociations() {
	const models = {
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
		Invoice,
	};

	Object.values(models).forEach((model) => {
		if (typeof model.associate === 'function') {
			model.associate(models);
		}
	});
}
