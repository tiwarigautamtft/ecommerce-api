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

export class Seller extends Model<
	InferAttributes<Seller>,
	InferCreationAttributes<Seller>
> {
	declare id: CreationOptional<string>;
	declare userId: ForeignKey<string>;
	declare storeName: string;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	static associate(models: Record<string, ModelStatic<any>>) {
		Seller.belongsTo(models.User, {
			foreignKey: 'userId',
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE',
		});
		Seller.hasMany(models.Product, { foreignKey: 'sellerId' });
		Seller.hasMany(models.SalesOrder, { foreignKey: 'sellerId' });
		Seller.hasMany(models.OrderItem, { foreignKey: 'sellerId' });
	}
}

Seller.init(
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
		storeName: { type: DataTypes.STRING, allowNull: false },
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: 'sellers',
		timestamps: true,
		underscored: true,
		indexes: [{ unique: true, fields: ['user_id'] }],
		scopes: {
			withoutUserId: {
				attributes: { exclude: ['userId'] },
			},
		},
	},
);
