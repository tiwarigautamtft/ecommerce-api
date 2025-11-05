import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Sequelize,
} from 'sequelize';
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
import { UserPreference } from '@/user/user-preference.model';

@Table({
	tableName: 'tags',
	timestamps: true,
	underscored: true,
	indexes: [{ unique: true, fields: ['name'] }],
})
export class Tag extends Model<
	InferAttributes<Tag>,
	InferCreationAttributes<Tag>
> {
	@PrimaryKey
	@Default(Sequelize.literal('uuidv7()'))
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.STRING)
	declare name: string;

	@Column(DataType.DATE)
	declare createdAt: CreationOptional<Date>;

	@Column(DataType.DATE)
	declare updatedAt: CreationOptional<Date>;

	@BelongsToMany(() => Product, () => ProductTag)
	declare products?: Product[];

	@BelongsToMany(() => Tag, () => UserPreference)
	declare userPreferences?: UserPreference[];
}
