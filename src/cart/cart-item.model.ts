import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Sequelize,
} from 'sequelize';
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
import { User } from '@/user/user.model';

@Table({
	tableName: 'cart_items',
	timestamps: true,
	underscored: true,
	indexes: [
		{ unique: true, fields: ['user_id', 'product_id'] },
		{ fields: ['user_id'] },
	],
})
export class CartItem extends Model<
	InferAttributes<CartItem>,
	InferCreationAttributes<CartItem>
> {
	@PrimaryKey
	@Default(Sequelize.literal('uuidv7()'))
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@ForeignKey(() => User)
	@Column(DataType.UUID)
	declare userId: string;

	@AllowNull(false)
	@ForeignKey(() => Product)
	@Column(DataType.UUID)
	declare productId: string;

	@AllowNull(false)
	@Default(1)
	@Column(DataType.INTEGER)
	declare quantity: CreationOptional<number>;

	@Column(DataType.DATE)
	declare createdAt: CreationOptional<Date>;

	@Column(DataType.DATE)
	declare updatedAt: CreationOptional<Date>;

	@BelongsTo(() => User)
	declare user?: User;

	@BelongsTo(() => Product)
	declare product?: Product;
}
