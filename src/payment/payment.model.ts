import {
	CreationOptional,
	DataTypes,
	ForeignKey,
	InferAttributes,
	InferCreationAttributes,
	Model,
	ModelStatic,
} from 'sequelize';

import { sequelize } from '@/lib/config';

import { PaymentStatus } from './payment-status.enum';

export class PaymentAttempt extends Model<
	InferAttributes<PaymentAttempt>,
	InferCreationAttributes<PaymentAttempt>
> {
	declare id: CreationOptional<string>;
	declare orderId: ForeignKey<string>;
	declare amount: number;
	declare status: CreationOptional<PaymentStatus>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	static associate(models: Record<string, ModelStatic<any>>) {
		PaymentAttempt.belongsTo(models.Order, {
			foreignKey: 'orderId',
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE',
		});
	}
}

PaymentAttempt.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: sequelize.literal('uuidv7()'),
		},
		orderId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'orders',
				key: 'id',
			},
		},
		amount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				min: 0,
			},
		},
		status: {
			type: DataTypes.ENUM(...Object.values(PaymentStatus)),
			allowNull: false,
			defaultValue: PaymentStatus.PROCESSING,
		},
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: 'payment_attempts',
		timestamps: true,
		underscored: true,
		indexes: [
			{
				fields: ['order_id'],
			},
			{
				fields: ['order_id', 'status'],
			},
		],
	},
);
