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

import { InvoiceStatus } from './invoice.enum';

export class Invoice extends Model<
	InferAttributes<Invoice>,
	InferCreationAttributes<Invoice>
> {
	declare id: CreationOptional<string>;
	declare orderId: ForeignKey<string>;
	declare amount: CreationOptional<number>;
	declare status: CreationOptional<InvoiceStatus>;

	static associate(models: Record<string, ModelStatic<any>>) {
		Invoice.belongsTo(models.Order, {
			foreignKey: 'orderId',
			onDelete: 'SET NULL',
			onUpdate: 'CASCADE',
		});
	}
}

Invoice.init(
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
		amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
		status: {
			type: DataTypes.ENUM(...Object.values(InvoiceStatus)),
			allowNull: false,
			defaultValue: InvoiceStatus.PENDING,
		},
	},
	{
		sequelize,
		tableName: 'invoices',
		timestamps: true,
		underscored: true,
	},
);
