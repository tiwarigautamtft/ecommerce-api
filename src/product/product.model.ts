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

export class Product extends Model<
	InferAttributes<Product>,
	InferCreationAttributes<Product>
> {
	declare id: CreationOptional<string>;
	declare sellerId: ForeignKey<string>;
	declare name: string;
	declare description: CreationOptional<string | null>;
	declare price: number;
	declare quantity: number;
	declare isPublished: CreationOptional<boolean>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	static associate(models: Record<string, ModelStatic<any>>) {
		Product.belongsTo(models.Seller, {
			foreignKey: 'sellerId',
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE',
		});

		Product.hasMany(models.CartItem, { foreignKey: 'productId' });
		Product.hasMany(models.OrderItem, { foreignKey: 'productId' });

		Product.belongsToMany(models.Tag, {
			through: models.ProductTag,
			as: 'tags',
		});
		Product.belongsToMany(models.User, {
			through: models.CartItem,
			as: 'cartItems',
			onDelete: 'SET NULL',
			onUpdate: 'CASCADE',
		});
	}
}

Product.init(
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
		name: { type: DataTypes.STRING, allowNull: false },
		description: { type: DataTypes.TEXT, allowNull: true },
		price: { type: DataTypes.INTEGER, allowNull: false },
		quantity: { type: DataTypes.INTEGER, allowNull: false },
		isPublished: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: 'products',
		timestamps: true,
		underscored: true,
		indexes: [
			{ unique: true, fields: ['name', 'seller_id'] },
			{ fields: ['seller_id'] },
			{ fields: ['name'] },
			{ fields: ['price'] },
			{ fields: ['is_published'] },
			{ fields: ['seller_id', 'is_published'] },
		],
	},
);
