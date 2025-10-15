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
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	static associate(models: Record<string, ModelStatic<any>>) {
		Product.belongsTo(models.Seller, {
			foreignKey: 'sellerId',
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE',
		});
		Product.hasMany(models.ProductTag, { foreignKey: 'productId' });
		Product.hasMany(models.OrderItem, { foreignKey: 'productId' });
		Product.hasMany(models.CartItem, { foreignKey: 'productId' });
		Product.belongsToMany(models.Tag, { through: 'ProductTag' });
	}
}

Product.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: sequelize.literal('uuidv7()'),
		},
		name: { type: DataTypes.STRING, allowNull: false },
		description: { type: DataTypes.TEXT, allowNull: true },
		price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
		quantity: { type: DataTypes.INTEGER, allowNull: false },
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: 'products',
		timestamps: true,
		underscored: true,
	},
);
