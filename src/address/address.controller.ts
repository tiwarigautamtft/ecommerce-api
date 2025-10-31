import assert from 'assert';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { addressService } from './address.service';

export const addressController: AddressController = {
	getAllAddresses: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const addresses = await addressService.getAllAddresses(req.user.id);
		res.status(StatusCodes.OK).json(addresses);
	},

	getAddress: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const address = await addressService.getAddress(
			req.user.id,
			req.params.addressId,
		);
		res.status(StatusCodes.OK).json(address);
	},

	createAddress: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const address = await addressService.createAddress(req.user.id, req.body);
		res.status(StatusCodes.CREATED).json(address);
	},

	updateAddress: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		const address = await addressService.updateAddress(
			req.user.id,
			req.params.addressId,
			req.body,
		);
		res.status(StatusCodes.OK).json(address);
	},

	deleteAddress: async (req, res) => {
		assert(req.user, 'User must be authenticated');
		await addressService.deleteAddress(req.user.id, req.params.addressId);
		res
			.status(StatusCodes.OK)
			.json({ message: 'Address deleted successfully.' });
	},
};

interface AddressController {
	getAllAddresses: RequestHandler;
	getAddress: RequestHandler;
	createAddress: RequestHandler;
	updateAddress: RequestHandler;
	deleteAddress: RequestHandler;
}
