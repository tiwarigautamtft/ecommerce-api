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

export class Address extends Model<
	InferAttributes<Address>,
	InferCreationAttributes<Address>
> {
	declare id: CreationOptional<string>;
	declare userId: ForeignKey<string>;
	declare alias: string;
	declare name: string;
	declare addressLineOne: string;
	declare addressLineTwo: CreationOptional<string | null>;
	declare city: string;
	declare state: string;
	declare pincode: string;
	declare phone: string;
	declare isDefault: CreationOptional<boolean>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	static associate(models: Record<string, ModelStatic<any>>) {
		Address.belongsTo(models.User, {
			foreignKey: 'userId',
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE',
		});
		Address.hasMany(models.Order, { foreignKey: 'shippingAddressId' });
	}
}

Address.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: sequelize.literal('uuidv7()'),
		},
		userId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id',
			},
		},
		alias: {
			type: DataTypes.STRING(30),
			allowNull: false,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		addressLineOne: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		addressLineTwo: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		city: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		state: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		pincode: {
			type: DataTypes.STRING(6),
			allowNull: false,
			validate: {
				isNumeric: true,
			},
		},
		phone: {
			type: DataTypes.STRING(15),
			allowNull: false,
		},
		isDefault: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: 'addresses',
		timestamps: true,
		underscored: true,
		indexes: [
			{
				unique: true,
				fields: ['user_id', 'alias'],
			},
			{
				fields: ['user_id'],
			},
			{
				fields: ['city'],
			},
			{
				fields: ['pincode'],
			},
			{
				fields: ['state'],
			},
		],
	},
);
