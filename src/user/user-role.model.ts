import { Sequelize } from 'sequelize';
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

import { Role } from '@/role/role.model';
import { User } from '@/user/user.model';

@Table({
	tableName: 'user_roles',
	timestamps: true,
	underscored: true,
	indexes: [
		{ unique: true, fields: ['user_id', 'role_id'] },
		{ fields: ['user_id'] },
	],
})
export class UserRole extends Model {
	@PrimaryKey
	@Default(Sequelize.literal('uuidv7()'))
	@Column(DataType.UUID)
	declare id: string;

	@AllowNull(false)
	@ForeignKey(() => User)
	@Column(DataType.UUID)
	declare userId: string;

	@AllowNull(false)
	@ForeignKey(() => Role)
	@Column(DataType.UUID)
	declare roleId: string;

	@Column(DataType.DATE)
	declare createdAt: Date;

	@Column(DataType.DATE)
	declare updatedAt: Date;

	@BelongsTo(() => User)
	declare user?: User;

	@BelongsTo(() => Role)
	declare role?: Role;
}
