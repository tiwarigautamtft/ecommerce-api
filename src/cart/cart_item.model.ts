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

export class CartItem extends Model<
	InferAttributes<CartItem>,
	InferCreationAttributes<CartItem>
> {
	declare id: CreationOptional<string>;
	declare userId: ForeignKey<string>;
	declare productId: ForeignKey<string>;
	declare quantity: CreationOptional<number>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	static associate(models: Record<string, ModelStatic<any>>) {
		CartItem.belongsTo(models.User, {
			foreignKey: 'userId',
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE',
		});
		CartItem.belongsTo(models.Product, {
			foreignKey: 'productId',
			onDelete: 'SET NULL',
			onUpdate: 'CASCADE',
		});
	}
}

CartItem.init(
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
		productId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: 'products', key: 'id' },
		},
		quantity: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: { min: 1 },
			defaultValue: 1,
		},
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: 'cart_items',
		timestamps: true,
		underscored: true,
		indexes: [
			{ unique: true, fields: ['user_id', 'product_id'] },
			{ fields: ['user_id'] },
		],
	},
);
