import { sequelize } from '@/lib/config';
import { NotFound } from '@/lib/exceptions';
import { generateTags, validateWithZodSchema } from '@/lib/utils';
import { ProductTag } from '@/product/product-tag.model';
import { Product } from '@/product/product.model';

import { CreateProductTagsDto } from './dto/create-product-tags.dto';
import { Tag } from './tag.model';

export const tagService: TagService = {
	createProductTags: async (productId, rawTagData) => {
		const { tags: tagNames } = await validateWithZodSchema(
			CreateProductTagsDto,
			rawTagData,
			'Invalid tags data',
		);

		const product = await Product.findByPk(productId);
		if (!product) throw new NotFound('Product not found.');

		return sequelize.transaction(async (transaction) => {
			await Tag.bulkCreate(
				tagNames.map((name) => ({ name })),
				{ ignoreDuplicates: true, transaction },
			);

			const tags = await Tag.findAll({
				where: { name: tagNames },
				transaction,
			});

			await ProductTag.bulkCreate(
				tags.map((tag) => ({ productId: product.id, tagId: tag.id })),
				{
					ignoreDuplicates: true,
					returning: true,
					transaction,
				},
			);

			return tags;
		});
	},

	generateProductTags: async (productId) => {
		const product = await Product.findByPk(productId);
		if (!product) throw new NotFound('Product not found.');
		return tagService.generateAndAssignTags(product);
	},

	getProductTags: async (productId) => {
		const product = await Product.findByPk(productId, {
			include: [{ model: Tag, as: 'tags', through: { attributes: [] } }],
		});
		if (!product) throw new NotFound('Product not found.');
		return product.tags!;
	},

	getProductTag: async (productId, tagId) => {
		const productTag = await ProductTag.findOne({
			where: { productId, tagId },
			include: [Tag],
		});
		if (!productTag) throw new NotFound('Tag not found on this product.');
		return productTag.tag!;
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
					productId: product.id,
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
}
