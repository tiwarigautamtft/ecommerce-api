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

import { CancellationBy, OrderStatus } from './order.enum';

export class Order extends Model<
	InferAttributes<Order>,
	InferCreationAttributes<Order>
> {
	declare id: CreationOptional<string>;
	declare buyerId: ForeignKey<string>;
	declare status: CreationOptional<OrderStatus>;
	declare cancelledBy: CreationOptional<CancellationBy>;
	declare totalAmount: number;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	static associate(models: Record<string, ModelStatic<any>>) {
		Order.belongsTo(models.Buyer, {
			foreignKey: 'buyerId',
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE',
		});
		Order.hasMany(models.OrderItem, { foreignKey: 'orderId' });
		Order.hasMany(models.SalesOrder, { foreignKey: 'orderId' });
		Order.hasOne(models.Invoice, { foreignKey: 'orderId' });
	}
}

Order.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: sequelize.literal('uuidv7()'),
		},
		buyerId: { type: DataTypes.UUID, allowNull: false },
		status: {
			type: DataTypes.ENUM(...Object.values(OrderStatus)),
			allowNull: false,
			defaultValue: OrderStatus.PENDING,
		},
		cancelledBy: {
			type: DataTypes.ENUM(...Object.values(CancellationBy)),
			allowNull: false,
			defaultValue: CancellationBy.NONE,
		},
		totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: 'orders',
		timestamps: true,
		underscored: true,
	},
);
