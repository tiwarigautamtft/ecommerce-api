import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Sequelize,
} from 'sequelize';
import {
	AllowNull,
	BelongsTo,
	Column,
	DataType,
	Default,
	ForeignKey,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { User } from '@/user/user.model';

import { Provider } from './auth.enum';

@Table({
	tableName: 'oauth_accounts',
	timestamps: true,
	underscored: true,
	indexes: [
		{ unique: true, fields: ['user_id', 'provider'] },
		{ unique: true, fields: ['provider', 'provider_sub'] },
		{ fields: ['user_id'] },
	],
})
export class OAuthAccount extends Model<
	InferAttributes<OAuthAccount>,
	InferCreationAttributes<OAuthAccount>
> {
	@PrimaryKey
	@Default(Sequelize.literal('uuidv7()'))
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@ForeignKey(() => User)
	@Column(DataType.UUID)
	declare userId: string;

	@AllowNull(false)
	@Column(DataType.ENUM(...Object.values(Provider)))
	declare provider: Provider;

	@AllowNull(false)
	@Column(DataType.STRING)
	declare providerSub: string;

	@Column(DataType.DATE)
	declare createdAt: CreationOptional<Date>;

	@Column(DataType.DATE)
	declare updatedAt: CreationOptional<Date>;

	@BelongsTo(() => User)
	declare user?: User;
}
