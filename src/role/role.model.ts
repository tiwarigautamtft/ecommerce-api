import {
	CreationOptional,
	InferAttributes,
	InferCreationAttributes,
	Sequelize,
} from 'sequelize';
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

import { UserRole } from '@/user/user-role.model';
import { User } from '@/user/user.model';

import { RoleName } from './role.enum';

@Table({
	tableName: 'roles',
	timestamps: true,
	underscored: true,
	indexes: [{ unique: true, fields: ['name'] }],
})
export class Role extends Model<
	InferAttributes<Role>,
	InferCreationAttributes<Role>
> {
	@PrimaryKey
	@Default(Sequelize.literal('uuidv7()'))
	@Column(DataType.UUID)
	declare id: CreationOptional<string>;

	@AllowNull(false)
	@Column(DataType.ENUM(...Object.values(RoleName)))
	declare name: RoleName;

	@AllowNull(true)
	@Column(DataType.TEXT)
	declare description: CreationOptional<string | null>;

	@Column(DataType.DATE)
	declare createdAt: CreationOptional<Date>;

	@Column(DataType.DATE)
	declare updatedAt: CreationOptional<Date>;

	@BelongsToMany(() => User, () => UserRole)
	declare users?: User[];
}
