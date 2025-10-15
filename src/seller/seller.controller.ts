import { RequestHandler } from 'express';

export const sellerController: SellerController = {
	getCurrentSellerProfile: (req, res) => {
		res.send('get current seller profile');
	},
	deleteCurrentSellerProfile: (req, res) => {
		res.send('delete current seller profile');
	},
};

interface SellerController {
	getCurrentSellerProfile: RequestHandler;
	deleteCurrentSellerProfile: RequestHandler;
}
