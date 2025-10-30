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
import { CancellationBy, OrderItemStatus } from '@/order';

export class OrderItem extends Model<
	InferAttributes<OrderItem>,
	InferCreationAttributes<OrderItem>
> {
	declare id: CreationOptional<string>;
	declare orderId: ForeignKey<string>;
	declare productId: ForeignKey<string>;
	declare sellerId: ForeignKey<string>;
	declare productName: string;
	declare unitPrice: number;
	declare quantity: number;
	declare status: CreationOptional<OrderItemStatus>;
	declare cancelledBy: CreationOptional<CancellationBy>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	static associate(models: Record<string, ModelStatic<any>>) {
		OrderItem.belongsTo(models.Order, {
			foreignKey: 'orderId',
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE',
		});
		OrderItem.belongsTo(models.Product, {
			foreignKey: 'productId',
			onDelete: 'NO ACTION',
			onUpdate: 'CASCADE',
		});
		OrderItem.belongsTo(models.Seller, {
			foreignKey: 'sellerId',
			onDelete: 'NO ACTION',
			onUpdate: 'CASCADE',
		});
	}
}

OrderItem.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: sequelize.literal('uuidv7()'),
		},
		orderId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: 'orders', key: 'id' },
		},
		productId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: 'products', key: 'id' },
		},
		sellerId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: 'sellers', key: 'id' },
		},
		productName: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		unitPrice: { type: DataTypes.INTEGER, allowNull: false },
		quantity: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: { min: 1 },
		},
		status: {
			type: DataTypes.ENUM(...Object.values(OrderItemStatus)),
			allowNull: false,
			defaultValue: OrderItemStatus.PENDING,
		},
		cancelledBy: {
			type: DataTypes.ENUM(...Object.values(CancellationBy)),
			allowNull: false,
			defaultValue: CancellationBy.NONE,
		},
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: 'order_items',
		timestamps: true,
		underscored: true,
		indexes: [
			{ unique: true, fields: ['order_id', 'product_id'] },
			{
				fields: ['order_id'],
			},
			{
				fields: ['seller_id'],
			},
			{
				fields: ['order_id', 'seller_id'],
			},
			{
				fields: ['seller_id', 'product_id'],
			},
			{
				fields: ['seller_id', 'status'],
			},
		],
	},
);
