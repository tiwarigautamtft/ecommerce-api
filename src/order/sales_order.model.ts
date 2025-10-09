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

export class SalesOrder extends Model<
	InferAttributes<SalesOrder>,
	InferCreationAttributes<SalesOrder>
> {
	declare id: CreationOptional<string>;
	declare sellerId: ForeignKey<string>;
	declare buyerId: ForeignKey<string>;
	declare orderId: ForeignKey<string>;
	declare totalAmount: number;

	static associate(models: Record<string, ModelStatic<any>>) {
		SalesOrder.belongsTo(models.Seller, { foreignKey: 'sellerId' });
		SalesOrder.belongsTo(models.Buyer, { foreignKey: 'buyerId' });
		SalesOrder.belongsTo(models.Order, { foreignKey: 'orderId' });
	}
}

SalesOrder.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: sequelize.literal('uuidv7()'),
		},
		sellerId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: 'sellers', key: 'id' },
		},
		buyerId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: 'buyers', key: 'id' },
		},
		orderId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: 'orders', key: 'id' },
		},
		totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
	},
	{
		sequelize,
		tableName: 'sales_orders',
		timestamps: true,
		underscored: true,
		indexes: [{ unique: true, fields: ['order_id', 'seller_id'] }],
	},
);
