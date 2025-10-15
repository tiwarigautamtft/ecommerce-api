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

export class Buyer extends Model<
	InferAttributes<Buyer>,
	InferCreationAttributes<Buyer>
> {
	declare id: CreationOptional<string>;
	declare userId: ForeignKey<string>;
	declare addressLineOne: string;
	declare addressLineTwo: CreationOptional<string | null>;
	declare city: string;
	declare state: string;
	declare pincode: number;
	declare phone: string;

	static associate(models: Record<string, ModelStatic<any>>) {
		Buyer.belongsTo(models.User, {
			foreignKey: 'userId',
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE',
		});
		Buyer.hasOne(models.Cart, { foreignKey: 'buyerId' });
		Buyer.hasMany(models.Order, { foreignKey: 'buyerId' });
		Buyer.hasMany(models.SalesOrder, { foreignKey: 'buyerId' });
	}
}

Buyer.init(
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
		addressLineOne: { type: DataTypes.STRING(255), allowNull: false },
		addressLineTwo: { type: DataTypes.STRING(255), allowNull: true },
		city: { type: DataTypes.STRING(255), allowNull: false },
		state: { type: DataTypes.STRING(255), allowNull: false },
		pincode: { type: DataTypes.INTEGER, allowNull: false },
		phone: { type: DataTypes.STRING(15), allowNull: false },
	},
	{
		sequelize,
		tableName: 'buyers',
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
