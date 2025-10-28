import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	ModelStatic,
} from 'sequelize';

import { sequelize } from '@/lib/config';

import { RoleName } from './role.enum';

export class Role extends Model<
	InferAttributes<Role>,
	InferCreationAttributes<Role>
> {
	declare id: CreationOptional<string>;
	declare name: RoleName;
	declare description: CreationOptional<string | null>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	static associate(models: Record<string, ModelStatic<any>>) {
		Role.belongsToMany(models.User, { through: models.UserRole, as: 'users' });
	}
}

Role.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: sequelize.literal('uuidv7()'),
		},
		name: {
			type: DataTypes.ENUM(...Object.values(RoleName)),
			allowNull: false,
		},
		description: { type: DataTypes.TEXT, allowNull: true },
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: 'roles',
		timestamps: true,
		underscored: true,
		indexes: [{ unique: true, fields: ['name'] }],
	},
);
