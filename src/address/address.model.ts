import { Sequelize } from 'sequelize';
import {
	AllowNull,
	BelongsTo,
	Column,
	DataType,
	Default,
	ForeignKey,
	HasMany,
	Model,
	PrimaryKey,
	Table,
} from 'sequelize-typescript';

import { Order } from '@/order/order.model';
import { User } from '@/user/user.model';

@Table({
	tableName: 'addresses',
	timestamps: true,
	underscored: true,
	indexes: [
		{ unique: true, fields: ['user_id', 'alias'] },
		{ fields: ['user_id'] },
		{ fields: ['city'] },
		{ fields: ['pincode'] },
		{ fields: ['state'] },
	],
})
export class Address extends Model {
	@PrimaryKey
	@Default(Sequelize.literal('uuidv7()'))
	@Column(DataType.UUID)
	declare id: string;

	@AllowNull(false)
	@ForeignKey(() => User)
	@Column(DataType.UUID)
	declare userId: string;

	@AllowNull(false)
	@Column(DataType.STRING(30))
	declare alias: string;

	@AllowNull(false)
	@Column(DataType.STRING)
	declare name: string;

	@AllowNull(false)
	@Column(DataType.STRING)
	declare addressLineOne: string;

	@AllowNull(true)
	@Column(DataType.STRING)
	declare addressLineTwo: string | null;

	@AllowNull(false)
	@Column(DataType.STRING)
	declare city: string;

	@AllowNull(false)
	@Column(DataType.STRING)
	declare state: string;

	@AllowNull(false)
	@Column(DataType.STRING(6))
	declare pincode: string;

	@AllowNull(false)
	@Column(DataType.STRING(15))
	declare phone: string;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare isDefault: boolean;

	@Column(DataType.DATE)
	declare createdAt: Date;

	@Column(DataType.DATE)
	declare updatedAt: Date;

	@BelongsTo(() => User)
	declare user?: User;

	@HasMany(() => Order)
	declare orders?: Order[];
}
