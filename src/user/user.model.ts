import { Sequelize } from 'sequelize';
import {
	AllowNull,
	BelongsToMany,
	Column,
	DataType,
	Default,
	HasMany,
	HasOne,
	IsEmail,
	IsUrl,
	Model,
	PrimaryKey,
	Scopes,
	Table,
} from 'sequelize-typescript';

import { Address } from '@/address/address.model';
import { OAuthAccount } from '@/auth/auth.model';
import { CartItem } from '@/cart/cart-item.model';
import { Role } from '@/role/role.model';
import { Seller } from '@/seller/seller.model';
import { UserRole } from '@/user/user-role.model';

@Scopes(() => ({
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
}))
@Table({
	tableName: 'users',
	timestamps: true,
	underscored: true,
	indexes: [{ unique: true, fields: ['email'] }],
})
export class User extends Model {
	@PrimaryKey
	@Default(Sequelize.literal('uuidv7()'))
	@Column(DataType.UUID)
	declare id: string;

	@AllowNull(false)
	@IsEmail
	@Column(DataType.STRING)
	declare email: string;

	@AllowNull(false)
	@Default(false)
	@Column(DataType.BOOLEAN)
	declare emailVerified: boolean;

	@AllowNull(false)
	@Column(DataType.STRING)
	declare name: string;

	@AllowNull(true)
	@IsUrl
	@Column(DataType.STRING)
	declare avatarUrl: string | null;

	@Column(DataType.DATE)
	declare createdAt: Date;

	@Column(DataType.DATE)
	declare updatedAt: Date;

	@HasOne(() => Seller)
	declare seller?: Seller;

	@HasMany(() => OAuthAccount)
	declare oauthAccounts?: OAuthAccount[];

	@HasMany(() => Address)
	declare addresses?: Address[];

	@HasMany(() => CartItem)
	declare cartItems?: CartItem[];

	@BelongsToMany(() => Role, () => UserRole)
	declare roles?: Role[];
}
