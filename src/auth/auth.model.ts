import {
	CreationOptional,
	DataTypes,
	ForeignKey,
	InferAttributes,
	InferCreationAttributes,
	Model,
	ModelStatic,
} from 'sequelize';

import { Provider } from '@/auth/auth.enum';
import { sequelize } from '@/lib/config';

export class OauthAccount extends Model<
	InferAttributes<OauthAccount>,
	InferCreationAttributes<OauthAccount>
> {
	declare id: CreationOptional<string>;
	declare userId: ForeignKey<string>;
	declare provider: Provider;
	declare providerSub: string;

	static associate(models: Record<string, ModelStatic<any>>) {
		OauthAccount.belongsTo(models.User, { foreignKey: 'userId' });
	}
}

OauthAccount.init(
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
		provider: {
			type: DataTypes.ENUM(...Object.values(Provider)),
			allowNull: false,
		},
		providerSub: { type: DataTypes.STRING, allowNull: false },
	},
	{
		sequelize,
		tableName: 'oauth_accounts',
		timestamps: true,
		underscored: true,
		indexes: [
			{ unique: true, fields: ['user_id', 'provider'] },
			{ unique: true, fields: ['provider', 'provider_sub'] },
		],
	},
);
