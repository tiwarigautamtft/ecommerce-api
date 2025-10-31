import { Sequelize } from 'sequelize';
import {
	AllowNull,
	BelongsTo,
	Column,
	DataType,
	Default,
	ForeignKey,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { Product } from '@/product/product.model';

import { Tag } from './tag.model';

@Table({
	tableName: 'product_tags',
	timestamps: true,
	underscored: true,
	indexes: [
		{ unique: true, fields: ['product_id', 'tag_id'] },
		{ fields: ['product_id'] },
		{ fields: ['tag_id'] },
	],
})
export class ProductTag extends Model {
	@PrimaryKey
	@Default(Sequelize.literal('uuidv7()'))
	@Column(DataType.UUID)
	declare id: string;

	@AllowNull(false)
	@ForeignKey(() => Product)
	@Column(DataType.UUID)
	declare productId: string;

	@AllowNull(false)
	@ForeignKey(() => Tag)
	@Column(DataType.UUID)
	declare tagId: string;

	@Column(DataType.DATE)
	declare createdAt: Date;

	@Column(DataType.DATE)
	declare updatedAt: Date;

	@BelongsTo(() => Product)
	declare product?: Product;

	@BelongsTo(() => Tag)
	declare tag?: Tag;
}
