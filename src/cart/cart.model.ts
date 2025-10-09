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

export class Cart extends Model<
	InferAttributes<Cart>,
	InferCreationAttributes<Cart>
> {
	declare id: CreationOptional<string>;
	declare buyerId: ForeignKey<string>;

	static associate(models: Record<string, ModelStatic<any>>) {
		Cart.belongsTo(models.Buyer, { foreignKey: 'buyerId' });
		Cart.hasMany(models.CartItem, { foreignKey: 'cartId' });
	}
}

Cart.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: sequelize.literal('uuidv7()'),
		},
		buyerId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: 'buyers', key: 'id' },
		},
	},
	{
		sequelize,
		tableName: 'carts',
		timestamps: true,
		underscored: true,
	},
);
