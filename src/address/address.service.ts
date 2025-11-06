import { Transaction } from 'sequelize';

import { sequelize } from '@/lib/config';
import { NotFound, SequelizeUniqueConstraintError } from '@/lib/exceptions';
import { validateWithZodSchema } from '@/lib/utils';

import { Address } from './address.model';
import {
	CreateAddressDto,
	CreateAddressDtoType,
	UpdateAddressDto,
} from './dto';

export const addressService: AddressService = {
	getAllAddresses: (userId) => {
		return Address.findAll({
			where: { userId },
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
		const addressData = await validateWithZodSchema(
			CreateAddressDto,
			rawAddressData,
			'Invalid address data',
		);

		try {
			const { isDefault, ...addressDataWithoutDefault } = addressData;
			let address = await Address.create({
				...addressDataWithoutDefault,
				userId,
			});

			if (isDefault) {
				address = (await addressService.setDefaultAddress(
					userId,
					address.id,
				)) as Address;
			}

			return address;
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
		const { isDefault, ...updateDataWithoutDefault } =
			await validateWithZodSchema(
				UpdateAddressDto,
				rawUpdateData,
				'Invalid address data',
			);

		return sequelize.transaction(async (transaction) => {
			const address = await Address.findOne({
				where: { id: addressId, userId },
				transaction,
			});

			if (!address) {
				throw new NotFound('Address not found.');
			}
			await address.update(updateDataWithoutDefault, { transaction });

			if (isDefault !== undefined) {
				if (isDefault) {
					await addressService.setDefaultAddress(
						userId,
						address.id,
						transaction,
					);
				} else if (address.isDefault) {
					await address.update({ isDefault: false }, { transaction });
				}
			}
			return address.reload({ transaction });
		});
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

	setDefaultAddress: async (userId, addressId, parentTransaction) => {
		const transaction = parentTransaction || (await sequelize.transaction());

		// Clear existing default
		await Address.update(
			{ isDefault: false },
			{ where: { userId, isDefault: true }, transaction },
		);

		// Set new default
		await Address.update(
			{ isDefault: true },
			{ where: { id: addressId, userId }, transaction },
		);

		if (!parentTransaction) {
			await transaction.commit();
		}

		return Address.findByPk(addressId);
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
		});
	},

	resolveShippingAddress: async (userId, shippingAddressInput) => {
		if (typeof shippingAddressInput === 'string') {
			const address = await Address.findOne({
				where: { userId, alias: shippingAddressInput },
			});
			if (!address)
				throw new NotFound(
					`Address with alias '${shippingAddressInput}' not found.`,
				);
			return address.id;
		}

		if (typeof shippingAddressInput === 'object') {
			const newAddress = await addressService.createAddress(
				userId,
				shippingAddressInput,
			);
			return newAddress.id;
		}

		const defaultAddress = await Address.findOne({
			where: { userId, isDefault: true },
		});
		if (!defaultAddress) {
			throw new NotFound(
				'No default address found. Please provide a shipping address.',
			);
		}
		return defaultAddress.id;
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
		parentTransaction?: Transaction,
	) => Promise<Address | null>;
	hasAddresses: (userId: string) => Promise<boolean>;
	getDefaultAddress: (userId: string) => Promise<Address>;
	getAddressByAlias: (userId: string, alias: string) => Promise<Address>;
	getAddressesByCity: (userId: string, city: string) => Promise<Address[]>;
	resolveShippingAddress: (
		userId: string,
		shippingAddressInput?: string | CreateAddressDtoType | undefined,
	) => Promise<string>;
}
