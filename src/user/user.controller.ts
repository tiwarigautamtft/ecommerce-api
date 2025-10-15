import assert from 'assert';
import { RequestHandler } from 'express';
import z from 'zod';

import { Buyer } from '@/buyer/buyer.model';
import { sequelize } from '@/lib/config';
import { emitter } from '@/lib/events/emitter';
import { Role, RoleName, UserRole } from '@/role';
import { Seller } from '@/seller';

import { CreateBuyerProfileSchema } from './dto';
import { UserEvent } from './user.event';
import { User } from './user.model';

export const userController: UserController = {
	getCurrentUser: (req, res) => {
		res.json(req.user);
	},

	updateCurrentUser: (req, res) => {
		res.send('update user');
	},

	deleteCurrentUser: async (req, res) => {
		try {
			await User.destroy({ where: { id: req.user?.id } });
		} catch (err) {
			console.error(err);
			res.status(500).json({ message: 'Could not delete user.' });
			return;
		}

		emitter.emit(UserEvent.DELETED, req.user?.id);

		req.logout((err) => {
			if (err) {
				res
					.status(500)
					.json({ message: 'User deleted but Logout Failed.', error: err });
				return;
			}

			res.status(200).json({ message: 'User deleted and Logout Successful' });
		});
	},

	getCurrentSellerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const profile = await Seller.scope('withoutUserId').findOne({
			where: { userId: req.user.id },
		});

		if (!profile) {
			res.status(404).json({ message: 'Seller profile not found.' });
			return;
		}

		res.status(200).json(profile);
	},

	createCurrentSellerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		if (!req.body) {
			res.status(400).json({ message: 'Request body is required.' });
			return;
		}

		const { storeName } = req.body;
		if (!storeName) {
			res.status(400).json({ message: 'storeName is required.' });
			return;
		}

		const user = req.user;
		let result;
		try {
			result = await sequelize.transaction(async (transaction) => {
				const seller = await Seller.create(
					{
						storeName,
						userId: user.id,
					},
					{ transaction },
				);

				const [role, _wasCreated] = await Role.findOrCreate({
					where: { name: RoleName.SELLER },
					transaction,
				});

				await UserRole.create(
					{
						userId: user.id,
						roleId: role.id,
					},
					{ transaction },
				);

				return seller;
			});
		} catch (error) {
			if ((error as any).name === 'SequelizeUniqueConstraintError') {
				res.status(400).json({ message: 'Seller profile already exists.' });
			} else {
				res.status(500).json({ message: 'Could not create seller profile.' });
			}
			return;
		}

		// emitter.emit(UserEvent.SELLER_PROFILE_CREATED, {
		// 	userId: req.user.id,
		// 	sellerId: result.id,
		// });

		req.user.roles = [...(req.user.roles || []), RoleName.SELLER];

		const { userId, ...newProfile } = result.toJSON();
		res.status(201).json(newProfile);
	},

	deleteCurrentSellerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const transaction = await sequelize.transaction();
		let result = await Seller.destroy({
			where: { userId: req.user.id },
			transaction,
		});
		if (result === 0) {
			res.status(404).json({ message: 'Seller profile not found.' });
			return;
		}

		const role = await Role.findOne({
			where: { name: RoleName.SELLER },
		});

		if (!role) {
			await transaction.rollback();
			res.status(500).json({ message: 'Could not find seller role.' });
			return;
		}

		result = await UserRole.destroy({
			where: { userId: req.user.id, roleId: role.id },
			transaction,
		});
		if (result === 0) {
			await transaction.rollback();
			res.status(500).json({ message: 'Could not delete seller role.' });
			return;
		}
		await transaction.commit();

		// emitter.emit(UserEvent.SELLER_PROFILE_DELETED, req.user.id);

		req.user.roles = (req.user.roles || []).filter(
			(role) => role !== RoleName.SELLER,
		);
		res.status(200).json({ message: 'Seller profile deleted.' });
	},

	getCurrentBuyerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const profile = await Buyer.scope('withoutUserId').findOne({
			where: { userId: req.user.id },
		});

		if (!profile) {
			res.status(404).json({ message: 'Buyer profile not found.' });
			return;
		}

		res.status(200).json(profile);
	},

	createCurrentBuyerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		if (!req.body) {
			res.status(400).json({ message: 'Request body is required.' });
			return;
		}

		const validationResult = await CreateBuyerProfileSchema.safeParseAsync(
			req.body,
		);

		if (validationResult.error) {
			console.error('Input validation failed:', validationResult.error);
			return res.status(422).json({
				message: 'Invalid input data.',
				error: z.treeifyError(validationResult.error),
			});
		}

		const data = validationResult.data;

		const user = req.user;
		let result;
		try {
			result = await sequelize.transaction(async (transaction) => {
				const buyer = await Buyer.create(
					{
						...data,
						userId: user.id,
					},
					{ transaction },
				);

				const [role, _wasCreated] = await Role.findOrCreate({
					where: { name: RoleName.BUYER },
					transaction,
				});

				await UserRole.create(
					{
						userId: user.id,
						roleId: role.id,
					},
					{ transaction },
				);

				return buyer;
			});
		} catch (error) {
			if ((error as any).name === 'SequelizeUniqueConstraintError') {
				res.status(400).json({ message: 'Buyer profile already exists.' });
			} else {
				res.status(500).json({ message: 'Could not create buyer profile.' });
			}
			return;
		}

		// emitter.emit(UserEvent.BUYER_PROFILE_CREATED, {
		// 	userId: req.user.id,
		// 	buyerId: result.id,
		// });

		req.user.roles = [...(req.user.roles || []), RoleName.BUYER];

		const { userId, ...newProfile } = result.toJSON();
		res.status(201).json(newProfile);
	},

	deleteCurrentBuyerProfile: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const transaction = await sequelize.transaction();
		let result = await Buyer.destroy({
			where: { userId: req.user.id },
			transaction,
		});
		if (result === 0) {
			res.status(404).json({ message: 'Buyer profile not found.' });
			return;
		}

		const role = await Role.findOne({
			where: { name: RoleName.BUYER },
		});

		if (!role) {
			await transaction.rollback();
			res.status(500).json({ message: 'Could not find buyer role.' });
			return;
		}

		result = await UserRole.destroy({
			where: { userId: req.user.id, roleId: role.id },
			transaction,
		});
		if (result === 0) {
			await transaction.rollback();
			res.status(500).json({ message: 'Could not delete buyer role.' });
			return;
		}
		await transaction.commit();

		// emitter.emit(UserEvent.BUYER_PROFILE_DELETED, req.user.id);

		req.user.roles = (req.user.roles || []).filter(
			(role) => role !== RoleName.BUYER,
		);
		res.status(200).json({ message: 'Buyer profile deleted.' });
	},
};

interface UserController {
	getCurrentUser: RequestHandler;
	updateCurrentUser: RequestHandler;
	deleteCurrentUser: RequestHandler;

	getCurrentSellerProfile: RequestHandler;
	createCurrentSellerProfile: RequestHandler;
	deleteCurrentSellerProfile: RequestHandler;

	getCurrentBuyerProfile: RequestHandler;
	createCurrentBuyerProfile: RequestHandler;
	deleteCurrentBuyerProfile: RequestHandler;
}
