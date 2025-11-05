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

import { Tag } from '@/tag/tag.model';
import { User } from '@/user/user.model';

@Table({
	tableName: 'user_preferences',
	timestamps: true,
	underscored: true,
	indexes: [
		{ fields: ['user_id'] },
		{ fields: ['user_id', 'weight'] },
		{ unique: true, fields: ['user_id', 'tag_id'] },
	],
})
export class UserPreference extends Model {
	@PrimaryKey
	@Default(Sequelize.literal('uuidv7()'))
	@Column(DataType.UUID)
	declare id: string;

	@AllowNull(false)
	@ForeignKey(() => User)
	@Column(DataType.UUID)
	declare userId: string;

	@AllowNull(false)
	@ForeignKey(() => Tag)
	@Column(DataType.UUID)
	declare tagId: string;

	@AllowNull(false)
	@Column(DataType.SMALLINT)
	declare weight: number;

	@Column(DataType.DATE)
	declare createdAt: Date;

	@Column(DataType.DATE)
	declare updatedAt: Date;

	@BelongsTo(() => User)
	declare user?: User;

	@BelongsTo(() => Tag)
	declare tag?: Tag;
}
