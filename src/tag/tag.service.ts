import { sequelize } from '@/lib/config';
import { NotFound } from '@/lib/exceptions';
import { generateTags, validateWithZodSchema } from '@/lib/utils';
import { ProductTag } from '@/product/product-tag.model';
import { Product } from '@/product/product.model';
import { productService } from '@/product/product.service';

import { CreateProductTagsDto } from './dto/create-product-tags.dto';
import { Tag } from './tag.model';

export const tagService: TagService = {
	createProductTags: async (productId, rawTagData) => {
		const { tags: tagNames } = await validateWithZodSchema(
			CreateProductTagsDto,
			rawTagData,
			'Invalid tags data',
		);

		// ensure that the product exists
		const product = await productService.getProductById(productId);
		return tagService.assignTags(product.id, tagNames);
	},

	generateProductTags: async (productId) => {
		const product = await productService.getProductById(productId);
		return tagService.generateAndAssignTags(product);
	},

	getProductTags: async (productId) => {
		const tags = await Tag.findAll({
			include: [
				{
					model: Product,
					where: { id: productId },
					attributes: [],
					through: { attributes: [] },
					required: true,
				},
			],
		});
		return tags || [];
	},

	getProductTag: async (productId, tagId) => {
		const tag = await Tag.findOne({
			where: { id: tagId },
			include: [
				{
					model: Product,
					where: { id: productId },
					attributes: [],
					through: { attributes: [] },
					required: true,
				},
			],
		});

		if (!tag) throw new NotFound('Tag not found on this product.');
		return tag;
	},

	removeProductTag: async (productId, tagId) => {
		const result = await ProductTag.destroy({ where: { productId, tagId } });
		if (result === 0) throw new NotFound('Tag not found on this product.');
	},

	removeAllProductTags: async (productId) => {
		await ProductTag.destroy({ where: { productId } });
	},

	generateAndAssignTags: async (product) => {
		const tagNames = await generateTags(product.name, product.description);

		return tagService.assignTags(product.id, tagNames);
	},

	assignTags: async (productId, tagNames) => {
		return sequelize.transaction(async (transaction) => {
			const tags = await Tag.bulkCreate(
				tagNames.map((tag) => ({ name: tag })),
				{
					returning: true,
					ignoreDuplicates: true,
					transaction,
				},
			);

			await ProductTag.bulkCreate(
				tags.map((tag) => ({
					productId: productId,
					tagId: tag.id,
				})),
				{
					ignoreDuplicates: true,
					transaction,
				},
			);

			return tags;
		});
	},
};

interface TagService {
	createProductTags: (productId: string, rawTagData: any) => Promise<Tag[]>;
	generateProductTags: (productId: string) => Promise<Tag[]>;
	getProductTags: (productId: string) => Promise<Tag[]>;
	getProductTag: (productId: string, tagId: string) => Promise<Tag>;
	removeProductTag: (productId: string, tagId: string) => Promise<void>;
	removeAllProductTags: (productId: string) => Promise<void>;
	generateAndAssignTags: (product: Product) => Promise<Tag[]>;
	assignTags: (productId: string, tagNames: string[]) => Promise<Tag[]>;
}
