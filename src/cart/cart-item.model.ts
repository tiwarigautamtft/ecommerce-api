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
export class CartItem extends Model {
	@PrimaryKey
	@Default(Sequelize.literal('uuidv7()'))
	@Column(DataType.UUID)
	declare id: string;

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
	declare quantity: number;

	@Column(DataType.DATE)
	declare createdAt: Date;

	@Column(DataType.DATE)
	declare updatedAt: Date;

	@BelongsTo(() => User)
	declare user?: User;

	@BelongsTo(() => Product)
	declare product?: Product;
}
