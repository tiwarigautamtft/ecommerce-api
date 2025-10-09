import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	ModelStatic,
} from 'sequelize';

import { sequelize } from '@/lib/config';

export class User extends Model<
	InferAttributes<User>,
	InferCreationAttributes<User>
> {
	declare id: CreationOptional<string>;
	declare email: string;
	declare emailVerified: CreationOptional<boolean>;
	declare name: string;
	declare avatarUrl: CreationOptional<string | null>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	static associate(models: Record<string, ModelStatic<any>>) {
		User.hasOne(models.Seller);
	}
}

User.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: sequelize.literal('uuidv7()'),
		},
		email: { type: DataTypes.STRING, allowNull: false, unique: true },
		emailVerified: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		name: { type: DataTypes.STRING, allowNull: false },
		avatarUrl: { type: DataTypes.STRING, allowNull: true },
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: 'users',
		timestamps: true,
		underscored: true,
	},
);
