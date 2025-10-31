import { init } from '@paralleldrive/cuid2';

import { Sequelize } from 'sequelize';
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
	Table,
} from 'sequelize-typescript';

import { Address } from '@/address/address.model';
import { OrderItem } from '@/order/order-item.model';
import { PaymentAttempt } from '@/payment/payment.model';
import { User } from '@/user/user.model';

const createCuid = init({
	length: 9,
});

function createOrderNumber() {
	return createCuid().toUpperCase();
}

@Table({
	tableName: 'orders',
	timestamps: true,
	underscored: true,
	indexes: [
		{ unique: true, fields: ['order_number'] },
		{ fields: ['user_id'] },
		{ fields: ['total'] },
	],
})
export class Order extends Model {
	@PrimaryKey
	@Default(Sequelize.literal('uuidv7()'))
	@Column(DataType.UUID)
	declare id: string;

	@AllowNull(false)
	@ForeignKey(() => User)
	@Column(DataType.UUID)
	declare userId: string;

	@AllowNull(false)
	@Default(createOrderNumber)
	@Column(DataType.STRING(9))
	declare orderNumber: string;

	@AllowNull(false)
	@Column(DataType.INTEGER)
	declare total: number;

	@AllowNull(false)
	@ForeignKey(() => Address)
	@Column(DataType.UUID)
	declare shippingAddressId: string;

	@Column(DataType.DATE)
	declare createdAt: Date;

	@Column(DataType.DATE)
	declare updatedAt: Date;

	@BelongsTo(() => User)
	declare user?: User;

	@BelongsTo(() => Address, { as: 'shippingAddress' })
	declare shippingAddress?: Address;

	@HasMany(() => OrderItem)
	declare orderItems?: OrderItem[];

	@HasMany(() => PaymentAttempt)
	declare paymentAttempts?: PaymentAttempt[];
}
