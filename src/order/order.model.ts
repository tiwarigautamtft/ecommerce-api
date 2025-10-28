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

export class Order extends Model<
	InferAttributes<Order>,
	InferCreationAttributes<Order>
> {
	declare id: CreationOptional<string>;
	declare userId: ForeignKey<string>;
	declare orderNumber: string;
	declare total: number;
	declare shippingAddressId: ForeignKey<string>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	static associate(models: Record<string, ModelStatic<any>>) {
		Order.belongsTo(models.User, {
			foreignKey: 'userId',
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE',
		});
		Order.belongsTo(models.Address, {
			foreignKey: 'shippingAddressId',
			onDelete: 'SET NULL',
			onUpdate: 'CASCADE',
		});
		Order.hasMany(models.OrderItem, { foreignKey: 'orderId' });
		Order.hasMany(models.PaymentAttempt, {
			foreignKey: 'orderId',
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE',
		});
	}
}

Order.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: sequelize.literal('uuidv7()'),
		},
		userId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: 'users', key: 'id' },
		},
		orderNumber: {
			type: DataTypes.STRING(9),
			allowNull: false,
		},
		total: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		shippingAddressId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: 'addresses', key: 'id' },
		},
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: 'orders',
		timestamps: true,
		underscored: true,
		indexes: [
			{ unique: true, fields: ['order_number'] },
			{ fields: ['user_id'] },
			{ fields: ['total'] },
		],
	},
);
