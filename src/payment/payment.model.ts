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

import { PaymentStatus } from './payment-status.enum';

@Table({
	tableName: 'payment_attempts',
	timestamps: true,
	underscored: true,
	indexes: [{ fields: ['order_id'] }, { fields: ['order_id', 'status'] }],
})
export class PaymentAttempt extends Model<
	InferAttributes<PaymentAttempt>,
	InferCreationAttributes<PaymentAttempt>
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
	@Column(DataType.INTEGER)
	declare amount: number;

	@AllowNull(false)
	@Default(PaymentStatus.PROCESSING)
	@Column(DataType.ENUM(...Object.values(PaymentStatus)))
	declare status: CreationOptional<PaymentStatus>;

	@Column(DataType.DATE)
	declare createdAt: CreationOptional<Date>;

	@Column(DataType.DATE)
	declare updatedAt: CreationOptional<Date>;

	@BelongsTo(() => Order)
	declare order?: Order;
}
