import { emitter } from '@/lib/events/emitter';
import { OrderEvent } from '@/order/order.event';
import { Order } from '@/order/order.model';
import { ProductEvent } from '@/product/product.event';
import { Product } from '@/product/product.model';

import { userService } from './user.service';

export function registerListeners() {
	emitter.on(
		ProductEvent.PRODUCT_VIEWED,
		async (userId: string | undefined, product: Product) => {
			console.log(
				`Event: ${ProductEvent.PRODUCT_VIEWED}, User: ${userId || 'Anonymous'}, Product: ${product.name}`,
			);
			if (!userId) return;
			const tags = await product.$get('tags', {
				raw: true,
				nest: true,
			});
			const tagNames = tags.map((tag) => tag.name);
			await userService.updatePreferences(userId, tagNames, 'viewed');
		},
	);

	emitter.on(OrderEvent.ORDER_PLACED, (userId: string, order: Order) => {
		console.log(
			`Event: ${OrderEvent.ORDER_PLACED}, User: ${userId}, Order ID: ${order.id}, Total: ${order.total}`,
		);
	});
}
