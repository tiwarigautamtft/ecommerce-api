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
	declare cartId: ForeignKey<string>;
	declare productId: ForeignKey<string>;
	declare quantity: number;

	static associate(models: Record<string, ModelStatic<any>>) {
		CartItem.belongsTo(models.Cart, {
			foreignKey: 'cartId',
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
		cartId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: 'carts', key: 'id' },
		},
		productId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: 'products', key: 'id' },
		},
		quantity: { type: DataTypes.INTEGER, allowNull: false },
	},
	{
		sequelize,
		tableName: 'cart_items',
		timestamps: true,
		underscored: true,
		indexes: [{ unique: true, fields: ['cart_id', 'product_id'] }],
	},
);
