import { Optional, Sequelize } from 'sequelize';
import {
	AllowNull,
	BelongsTo,
	Column,
	DataType,
	Default,
	ForeignKey,
	HasMany,
	Model,
	PrimaryKey,
	Scopes,
	Table,
} from 'sequelize-typescript';

import { OrderItem } from '@/order/order-item.model';
import { Product } from '@/product/product.model';
import { User } from '@/user/user.model';

@Scopes(() => ({
	withoutUserId: {
		attributes: { exclude: ['userId'] },
	},
}))
@Table({
	tableName: 'sellers',
	timestamps: true,
	underscored: true,
	indexes: [
		{ unique: true, fields: ['user_id'] },
		{ unique: true, fields: ['store_name'] },
	],
})
export class Seller extends Model {
	@PrimaryKey
	@Default(Sequelize.literal('uuidv7()'))
	@Column(DataType.UUID)
	declare id: string;

	@AllowNull(false)
	@ForeignKey(() => User)
	@Column(DataType.UUID)
	declare userId: string;

	@AllowNull(false)
	@Column(DataType.STRING(50))
	declare storeName: string;

	@Column(DataType.DATE)
	declare createdAt: Date;

	@Column(DataType.DATE)
	declare updatedAt: Date;

	@BelongsTo(() => User)
	declare user?: User;

	@HasMany(() => Product)
	declare products?: Product[];

	@HasMany(() => OrderItem)
	declare orderItems?: OrderItem[];
}
