import { z } from 'zod';

import { sequelize } from '@/lib/config';
import {
	NotFound,
	SequelizeUniqueConstraintError,
	UnprocessableEntity,
} from '@/lib/exceptions';

import { Address } from './address.model';
import {
	CreateAddressDto,
	UpdateAddressDto,
	UpdateAddressDtoType,
} from './dto';

export const addressService: AddressService = {
	getAllAddresses: (userId) => {
		return Address.findAll({
			where: { userId },
			order: [
				['is_default', 'DESC'],
				['created_at', 'DESC'],
			],
		});
	},

	getAddress: async (userId, addressId) => {
		const address = await Address.findOne({
			where: { id: addressId, userId },
		});

		if (!address) {
			throw new NotFound('Address not found.');
		}

		return address;
	},

	createAddress: async (userId, rawAddressData) => {
		const validationResult =
			await CreateAddressDto.safeParseAsync(rawAddressData);
		if (validationResult.error) {
			throw new UnprocessableEntity(
				'Invalid address data.',
				z.treeifyError(validationResult.error),
			);
		}

		const addressData = validationResult.data;

		try {
			return sequelize.transaction(async (transaction) => {
				if (addressData.isDefault) {
					await Address.update(
						{ isDefault: false },
						{ where: { userId, isDefault: true }, transaction },
					);
				}

				const address = await Address.create(
					{
						...addressData,
						userId,
					},
					{ transaction },
				);

				return address;
			});
		} catch (error) {
			if ((error as any)?.name === 'SequelizeUniqueConstraintError') {
				throw new SequelizeUniqueConstraintError(
					`Address with alias '${addressData.alias}' already exists for this user.`,
				);
			}
			throw error;
		}
	},

	updateAddress: async (userId, addressId, rawUpdateData) => {
		const validationResult =
			await UpdateAddressDto.safeParseAsync(rawUpdateData);
		if (validationResult.error) {
			throw new UnprocessableEntity(
				'Invalid address data.',
				z.treeifyError(validationResult.error),
			);
		}

		const updateData = validationResult.data;

		const address = await Address.findOne({
			where: { id: addressId, userId },
		});

		if (!address) {
			throw new NotFound('Address not found.');
		}

		if (updateData.isDefault) {
			await Address.update(
				{ isDefault: false },
				{ where: { userId, isDefault: true } },
			);
		}

		await address.update(updateData);
		return address;
	},

	deleteAddress: async (userId, addressId) => {
		const address = await Address.findOne({
			where: { id: addressId, userId },
		});

		if (!address) {
			throw new NotFound('Address not found.');
		}

		await address.destroy();
	},

	setDefaultAddress: (userId, addressId) => {
		return sequelize.transaction(async (transaction) => {
			// Clear existing default
			await Address.update(
				{ isDefault: false },
				{ where: { userId, isDefault: true }, transaction },
			);

			// Set new default
			const [affectedCount] = await Address.update(
				{ isDefault: true },
				{ where: { id: addressId, userId }, transaction },
			);

			if (affectedCount === 0) {
				throw new NotFound('Address not found.');
			}

			return Address.findByPk(addressId);
		});
	},

	hasAddresses: async (userId): Promise<boolean> => {
		const count = await Address.count({ where: { userId } });
		return count > 0;
	},

	getDefaultAddress: async (userId) => {
		const address = await Address.findOne({
			where: { userId, isDefault: true },
		});

		if (!address) {
			throw new NotFound('No default address found.');
		}

		return address;
	},

	validateAddressOwnership: async (userId, addressId) => {
		const count = await Address.count({
			where: { id: addressId, userId },
		});
		return count > 0;
	},

	bulkUpdateAddresses: (userId, updates) => {
		return sequelize.transaction(async (transaction) => {
			const results = [];

			for (const { addressId, data } of updates) {
				const address = await Address.findOne({
					where: { id: addressId, userId },
					transaction,
				});

				if (!address) {
					throw new NotFound(`Address with ID ${addressId} not found.`);
				}

				// Validate update data
				const validationResult = await UpdateAddressDto.safeParseAsync(data);
				if (validationResult.error) {
					throw new UnprocessableEntity(
						`Invalid data for address ${addressId}.`,
						z.treeifyError(validationResult.error),
					);
				}

				const updateData = validationResult.data;

				// Handle default address logic
				if (updateData.isDefault) {
					await Address.update(
						{ isDefault: false },
						{ where: { userId, isDefault: true }, transaction },
					);
				}

				await address.update(updateData, { transaction });
				results.push(address);
			}

			return results;
		});
	},

	getAddressByAlias: async (userId, alias) => {
		const address = await Address.findOne({
			where: { userId, alias },
		});

		if (!address) {
			throw new NotFound(`Address with alias '${alias}' not found.`);
		}

		return address;
	},

	getAddressesByCity: async (userId, city) => {
		return Address.findAll({
			where: { userId, city },
			order: [['is_default', 'DESC']],
		});
	},

	getAddressCount: async (userId) => {
		return Address.count({ where: { userId } });
	},
};

interface AddressService {
	getAllAddresses: (userId: string) => Promise<Address[]>;
	getAddress: (userId: string, addressId: string) => Promise<Address>;
	createAddress: (userId: string, rawAddressData: any) => Promise<Address>;
	updateAddress: (
		userId: string,
		addressId: string,
		rawUpdateData: any,
	) => Promise<Address>;
	deleteAddress: (userId: string, addressId: string) => Promise<void>;
	setDefaultAddress: (
		userId: string,
		addressId: string,
	) => Promise<Address | null>;
	hasAddresses: (userId: string) => Promise<boolean>;
	getDefaultAddress: (userId: string) => Promise<Address>;
	validateAddressOwnership: (
		userId: string,
		addressId: string,
	) => Promise<boolean>;
	bulkUpdateAddresses: (
		userId: string,
		updates: Array<{
			addressId: string;
			data: Partial<UpdateAddressDtoType>;
		}>,
	) => Promise<Address[]>;
	getAddressByAlias: (userId: string, alias: string) => Promise<Address>;
	getAddressesByCity: (userId: string, city: string) => Promise<Address[]>;
	getAddressCount: (userId: string) => Promise<number>;
}
