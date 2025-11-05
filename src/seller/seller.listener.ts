import { emitter } from '@/lib/events/emitter';
import { generateTags } from '@/lib/utils';
import { ProductTag } from '@/product/product-tag.model';
import { Product } from '@/product/product.model';
import { Tag } from '@/tag/tag.model';
import { tagService } from '@/tag/tag.service';

import { UpdateProductDtoType } from './dto';
import { SellerEvent } from './seller.event';

export function registerListeners() {
	emitter.on(
		SellerEvent.PRODUCT_CREATED,
		async function (sellerId: string, product: Product) {
			console.log(
				`Event: ${SellerEvent.PRODUCT_CREATED}, Seller: ${sellerId}, Product: ${product.name}`,
			);
			await tagService.generateAndAssignTags(product);
		},
	);

	emitter.on(
		SellerEvent.PRODUCT_UPDATED,
		async function (
			sellerId: string,
			updatedProduct: Product,
			data: UpdateProductDtoType,
		) {
			console.log(
				`Event: ${SellerEvent.PRODUCT_UPDATED}, Seller: ${sellerId}, Product: ${updatedProduct.name}`,
			);

			if (data.name || data.description) {
				await tagService.updateProductTags(updatedProduct);
			} else {
				console.log('No changes to name or description; tags not updated.');
			}
		},
	);

	emitter.on(
		SellerEvent.PRODUCT_DELETED,
		async function (sellerId: string, productId: string) {
			console.log(
				`Event: ${SellerEvent.PRODUCT_DELETED}, Seller: ${sellerId}, Product: ${productId}`,
			);

			await tagService.removeProductTags(productId);
		},
	);
}
