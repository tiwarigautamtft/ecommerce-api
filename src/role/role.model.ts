import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	ModelStatic,
} from 'sequelize';

import { sequelize } from '@/lib/config';

export class Role extends Model<
	InferAttributes<Role>,
	InferCreationAttributes<Role>
> {
	declare id: CreationOptional<string>;
	declare name: string;
	declare description: CreationOptional<string | null>;

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
		name: { type: DataTypes.STRING, allowNull: false },
		description: { type: DataTypes.STRING, allowNull: true },
	},
	{
		sequelize,
		tableName: 'roles',
		timestamps: true,
		underscored: true,
		indexes: [{ unique: true, fields: ['name'] }],
	},
);
