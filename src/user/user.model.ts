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
import { Role } from '@/role';

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
		User.hasOne(models.Seller, { foreignKey: 'userId' });
		User.hasOne(models.Buyer, { foreignKey: 'userId' });
		User.hasMany(models.OAuthAccount, { foreignKey: 'userId' });
		User.belongsToMany(models.Role, { through: models.UserRole, as: 'roles' });
	}
}

User.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: sequelize.literal('uuidv7()'),
		},
		email: { type: DataTypes.STRING, allowNull: false },
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
		indexes: [{ unique: true, fields: ['email'] }],
		scopes: {
			sessionUser: {
				include: [
					{
						model: Role,
						as: 'roles',
						attributes: ['name'],
						through: { attributes: [] },
					},
				],
				attributes: { exclude: ['createdAt', 'updatedAt'] },
			},
		},
	},
);
