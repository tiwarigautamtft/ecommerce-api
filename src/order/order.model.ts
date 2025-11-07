import { init } from '@paralleldrive/cuid2';

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
	HasMany,
	Model,
	PrimaryKey,
	Scopes,
	Table,
} from 'sequelize-typescript';

import { Address } from '@/address/address.model';
import { PaymentStatus } from '@/payment/payment-status.enum';
import { PaymentAttempt } from '@/payment/payment.model';
import { User } from '@/user/user.model';

import { OrderItem } from './order-item.model';

const createCuid = init({
	length: 9,
});

function createOrderNumber() {
	return createCuid().toUpperCase();
}

@Scopes(() => ({
	seller: {
		include: [
			{
				model: PaymentAttempt,
				required: true,
				where: { status: PaymentStatus.SUCCESS },
				attributes: [],
			},
			{
				model: Address,
				as: 'shippingAddress',
				required: true,
				attributes: {
					exclude: ['userId', 'alias', 'isDefault', 'createdAt', 'updatedAt'],
				},
			},
		],
	},
}))
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
export class Order extends Model<
	InferAttributes<Order>,
	InferCreationAttributes<Order>
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
	@Default(createOrderNumber)
	@Column(DataType.STRING(9))
	declare orderNumber: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.INTEGER)
	declare total: number;

	@AllowNull(false)
	@ForeignKey(() => Address)
	@Column(DataType.UUID)
	declare shippingAddressId: string;

	@Column(DataType.DATE)
	declare createdAt: CreationOptional<Date>;

	@Column(DataType.DATE)
	declare updatedAt: CreationOptional<Date>;

	@BelongsTo(() => User)
	declare user?: User;

	@BelongsTo(() => Address, { as: 'shippingAddress' })
	declare shippingAddress?: Address;

	@HasMany(() => OrderItem)
	declare orderItems?: OrderItem[];

	@HasMany(() => PaymentAttempt)
	declare paymentAttempts?: PaymentAttempt[];
}
