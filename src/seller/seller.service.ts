import { sequelize } from '@/lib/config';
import {
	InternalServerError,
	NotFound,
	SequelizeUniqueConstraintError,
} from '@/lib/exceptions';
import { validateWithZodSchema } from '@/lib/utils';
import { OrderItem } from '@/order/order-item.model';
import { OrderItemStatus } from '@/order/order.enum';
import { Product } from '@/product/product.model';
import { RoleName } from '@/role/role.enum';
import { Role } from '@/role/role.model';
import { UserRole } from '@/user/user-role.model';

import { CreateSellerProfileDto } from './dto';
import { Seller } from './seller.model';

export const sellerService: SellerService = {
	getSellerProfile: async (userId) => {
		const profile = await Seller.scope('withoutUserId').findOne({
			where: { userId },
		});
		if (!profile) throw new NotFound('Seller profile not found.');
		return profile;
	},

	createSellerProfile: async (userId, rawProfileData) => {
		const { storeName } = await validateWithZodSchema(
			CreateSellerProfileDto,
			rawProfileData,
			'Invalid profile data',
		);

		return sequelize.transaction(async (transaction) => {
			const [role] = await Role.findOrCreate({
				where: { name: RoleName.SELLER },
				transaction,
			});

			try {
				const [seller] = await Promise.all([
					Seller.create({ storeName, userId }, { transaction }),
					UserRole.upsert({ userId, roleId: role.id }, { transaction }),
				]);

				return seller;
			} catch (error) {
				if ((error as any)?.name === 'SequelizeUniqueConstraintError') {
					throw new SequelizeUniqueConstraintError(
						'Seller profile already exists.',
					);
				}
				throw new InternalServerError('Could not create seller profile.');
			}
		});
	},

	deleteSellerProfile: async (userId) => {
		await sequelize.transaction(async (transaction) => {
			const seller = await Seller.findOne({ where: { userId }, transaction });
			if (!seller) throw new NotFound('Seller profile not found.');

			const role = await Role.findOne({
				where: { name: RoleName.SELLER },
				transaction,
			});
			if (!role) throw new InternalServerError('Could not find seller role.');

			await Promise.all([
				Seller.destroy({ where: { userId }, transaction }),
				UserRole.destroy({ where: { userId, roleId: role.id }, transaction }),
			]);
		});
	},

	getSellerStats: async (userId) => {
		const seller = await Seller.findOne({ where: { userId } });
		if (!seller) throw new NotFound('Seller profile not found.');

		const [productCount, orderCount, totalRevenue] = await Promise.all([
			Product.count({ where: { sellerId: seller.id } }),
			OrderItem.count({ where: { sellerId: seller.id } }),
			OrderItem.sum('unitPrice', {
				where: {
					sellerId: seller.id,
					status: OrderItemStatus.DELIVERED,
				},
			}) || 0,
		]);

		return {
			sellerId: seller.id,
			storeName: seller.storeName,
			stats: {
				productCount,
				orderCount,
				totalRevenue,
			},
		};
	},
};

interface SellerService {
	getSellerProfile: (userId: string) => Promise<Seller>;
	createSellerProfile: (userId: string, rawProfileData: any) => Promise<Seller>;
	deleteSellerProfile: (userId: string) => Promise<void>;
	getSellerStats: (userId: string) => Promise<{
		sellerId: string;
		storeName: string;
		stats: {
			productCount: number;
			orderCount: number;
			totalRevenue: number;
		};
	}>;
}
