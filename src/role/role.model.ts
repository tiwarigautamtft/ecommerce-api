import { Sequelize } from 'sequelize';
import {
	AllowNull,
	BelongsToMany,
	Column,
	DataType,
	Default,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { User } from '@/user/user.model';

import { UserRole } from '../user/user-role.model';
import { RoleName } from './role.enum';

@Table({
	tableName: 'roles',
	timestamps: true,
	underscored: true,
	indexes: [{ unique: true, fields: ['name'] }],
})
export class Role extends Model {
	@PrimaryKey
	@Default(Sequelize.literal('uuidv7()'))
	@Column(DataType.UUID)
	declare id: string;

	@AllowNull(false)
	@Column(DataType.ENUM(...Object.values(RoleName)))
	declare name: RoleName;

	@AllowNull(true)
	@Column(DataType.TEXT)
	declare description: string | null;

	@Column(DataType.DATE)
	declare createdAt: Date;

	@Column(DataType.DATE)
	declare updatedAt: Date;

	@BelongsToMany(() => User, () => UserRole)
	declare users?: User[];
}
