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

import { Order } from '@/order/order.model';
import { Product } from '@/product/product.model';
import { Seller } from '@/seller/seller.model';

import { CancellationBy, OrderItemStatus } from './order.enum';

@Table({
	tableName: 'order_items',
	timestamps: true,
	underscored: true,
	indexes: [
		{ unique: true, fields: ['order_id', 'product_id'] },
		{ fields: ['order_id'] },
		{ fields: ['seller_id'] },
		{ fields: ['order_id', 'seller_id'] },
		{ fields: ['seller_id', 'product_id'] },
		{ fields: ['seller_id', 'status'] },
	],
})
export class OrderItem extends Model<
	InferAttributes<OrderItem>,
	InferCreationAttributes<OrderItem>
> {
	@PrimaryKey
	@Default(Sequelize.literal('uuidv7()'))
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@ForeignKey(() => Order)
	@Column(DataType.UUID)
	declare orderId: string;

	@AllowNull(false)
	@ForeignKey(() => Product)
	@Column(DataType.UUID)
	declare productId: string;

	@AllowNull(false)
	@ForeignKey(() => Seller)
	@Column(DataType.UUID)
	declare sellerId: string;

	@AllowNull(false)
	@Column(DataType.STRING)
	declare productName: string;

	@AllowNull(false)
	@Column(DataType.INTEGER)
	declare unitPrice: number;

	@AllowNull(false)
	@Column(DataType.INTEGER)
	declare quantity: number;

	@AllowNull(false)
	@Default(OrderItemStatus.PENDING)
	@Column(DataType.ENUM(...Object.values(OrderItemStatus)))
	declare status: CreationOptional<OrderItemStatus>;

	@AllowNull(false)
	@Default(CancellationBy.NONE)
	@Column(DataType.ENUM(...Object.values(CancellationBy)))
	declare cancelledBy: CreationOptional<CancellationBy>;

	@Column(DataType.DATE)
	declare createdAt: CreationOptional<Date>;

	@Column(DataType.DATE)
	declare updatedAt: CreationOptional<Date>;

	@BelongsTo(() => Order)
	declare order?: Order;

	@BelongsTo(() => Product)
	declare product?: Product;

	@BelongsTo(() => Seller)
	declare seller?: Seller;
}
