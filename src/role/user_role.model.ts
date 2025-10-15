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

export class UserRole extends Model<
	InferAttributes<UserRole>,
	InferCreationAttributes<UserRole>
> {
	declare id: CreationOptional<string>;
	declare userId: ForeignKey<string>;
	declare roleId: ForeignKey<string>;

	static associate(models: Record<string, ModelStatic<any>>) {
		UserRole.belongsTo(models.User, {
			foreignKey: 'userId',
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE',
		});
		UserRole.belongsTo(models.Role, {
			foreignKey: 'roleId',
			onDelete: 'RESTRICT',
			onUpdate: 'CASCADE',
		});
	}
}

UserRole.init(
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
		roleId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: 'roles', key: 'id' },
		},
	},
	{
		sequelize,
		tableName: 'user_roles',
		timestamps: true,
		underscored: true,
		indexes: [
			{ unique: true, fields: ['user_id', 'role_id'] },
			{ fields: ['user_id'] },
		],
	},
);
