import { Sequelize } from 'sequelize';
import {
	AllowNull,
	BelongsTo,
	BelongsToMany,
	Column,
	DataType,
	Default,
	ForeignKey,
	HasMany,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { CartItem } from '@/cart/cart-item.model';
import { OrderItem } from '@/order/order-item.model';
import { ProductTag } from '@/product/product-tag.model';
import { Seller } from '@/seller/seller.model';

import { Tag } from './tag.model';

@Table({
	tableName: 'products',
	timestamps: true,
	underscored: true,
	indexes: [
		{ unique: true, fields: ['name', 'seller_id'] },
		{ fields: ['seller_id'] },
		{ fields: ['name'] },
		{ fields: ['price'] },
		{ fields: ['is_published'] },
		{ fields: ['seller_id', 'is_published'] },
	],
})
export class Product extends Model {
	@PrimaryKey
	@Default(Sequelize.literal('uuidv7()'))
	@Column(DataType.UUID)
	declare id: string;

	@AllowNull(false)
	@ForeignKey(() => Seller)
	@Column(DataType.UUID)
	declare sellerId: string;

	@AllowNull(false)
	@Column(DataType.STRING)
	declare name: string;

	@AllowNull(true)
	@Column(DataType.TEXT)
	declare description: string | null;

	@AllowNull(false)
	@Column(DataType.INTEGER)
	declare price: number;

	@AllowNull(false)
	@Column(DataType.INTEGER)
	declare quantity: number;

	@AllowNull(false)
	@Default(true)
	@Column(DataType.BOOLEAN)
	declare isPublished: boolean;

	@Column(DataType.DATE)
	declare createdAt: Date;

	@Column(DataType.DATE)
	declare updatedAt: Date;

	@BelongsTo(() => Seller)
	declare seller?: Seller;

	@HasMany(() => CartItem)
	declare cartItems?: CartItem[];

	@HasMany(() => OrderItem)
	declare orderItems?: OrderItem[];

	@BelongsToMany(() => Tag, () => ProductTag)
	declare tags?: Tag[];
}
