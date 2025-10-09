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
		Role.hasMany(models.UserRole, { foreignKey: 'roleId' });
	}
}

Role.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: sequelize.literal('uuidv7()'),
		},
		name: { type: DataTypes.STRING, allowNull: false, unique: true },
		description: { type: DataTypes.STRING, allowNull: true },
	},
	{
		sequelize,
		tableName: 'roles',
		timestamps: true,
		underscored: true,
	},
);
