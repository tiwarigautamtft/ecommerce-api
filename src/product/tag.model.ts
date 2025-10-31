import { Sequelize } from 'sequelize';
import {
	AllowNull,
	BelongsToMany,
	Column,
	DataType,
	Default,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { ProductTag } from '@/product/product-tag.model';
import { Product } from '@/product/product.model';

@Table({
	tableName: 'tags',
	timestamps: true,
	underscored: true,
	indexes: [{ unique: true, fields: ['name'] }],
})
export class Tag extends Model {
	@PrimaryKey
	@Default(Sequelize.literal('uuidv7()'))
	@Column(DataType.UUID)
	declare id: string;

	@AllowNull(false)
	@Column(DataType.STRING)
	declare name: string;

	@Column(DataType.DATE)
	declare createdAt: Date;

	@Column(DataType.DATE)
	declare updatedAt: Date;

	@BelongsToMany(() => Product, () => ProductTag)
	declare products?: Product[];
}
