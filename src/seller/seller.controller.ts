import assert from 'assert';
import { RequestHandler } from 'express';
import z from 'zod';

import { Product } from '@/product';

import { CreateProductDto, UpdateProductDto } from './dto';
import { Seller } from './seller.model';

export const sellerController: SellerController = {
	getCurrentSellerProfile: (req, res) => {
		res.send('get current seller profile');
	},
	deleteCurrentSellerProfile: (req, res) => {
		res.send('delete current seller profile');
	},

	createProduct: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const validationResult = await CreateProductDto.safeParseAsync(req.body);

		if (validationResult.error) {
			console.error('Input validation failed:', validationResult.error);
			res.status(422).json({
				message: 'Invalid input data.',
				error: z.treeifyError(validationResult.error),
			});
			return;
		}

		const data = validationResult.data;
		const user = req.user;
		const seller = await Seller.findOne({ where: { userId: user.id } });
		if (!seller) {
			res.status(404).json({ message: 'Seller profile not found.' });
			return;
		}
		const sellerId = seller.id;

		const product = await Product.create({ ...data, sellerId });
		res.status(201).json(product);
	},

	getAllProducts: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const seller = await Seller.findOne({ where: { userId: user.id } });

		if (!seller) {
			res.status(404).json({ message: 'Seller profile not found.' });
			return;
		}

		const sellerId = seller.id;

		const products = await Product.findAll({ where: { sellerId } });
		res.status(200).json(products);
	},

	getProductById: async (req, res) => {
		const productId = req.params.productId;
		const product = await Product.findByPk(productId);

		if (!product) {
			res.status(404).json({ message: 'Product not found' });
			return;
		}

		res.status(200).json(product);
	},

	updateProductById: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const productId = req.params.productId;
		const validationResult = await UpdateProductDto.safeParseAsync(req.body);

		if (validationResult.error) {
			console.error('Input validation failed:', validationResult.error);
			res.status(422).json({
				message: 'Invalid input data.',
				error: z.treeifyError(validationResult.error),
			});
			return;
		}

		const data = validationResult.data;
		const user = req.user;
		const seller = await Seller.findOne({ where: { userId: user.id } });

		if (!seller) {
			res.status(404).json({ message: 'Seller profile not found.' });
			return;
		}

		const [affectedRows, updatedProducts] = await Product.update(data, {
			where: { id: productId, sellerId: seller.id },
			returning: true,
		});

		if (affectedRows === 0) {
			res.status(500).json({ message: 'Could not update product' });
			return;
		}

		res.status(200).json(updatedProducts[0]);
	},

	deleteAllProducts: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const seller = await Seller.findOne({ where: { userId: user.id } });

		if (!seller) {
			res.status(404).json({ message: 'Seller profile not found.' });
			return;
		}

		try {
			await Product.destroy({ where: { sellerId: seller.id } });
		} catch (err) {
			console.error(err);
			res.status(500).json({ message: 'Could not delete products' });
			return;
		}

		res.status(200).json({ message: 'All products deleted' });
	},

	deleteProductById: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		const user = req.user;
		const seller = await Seller.findOne({ where: { userId: user.id } });

		if (!seller) {
			res.status(404).json({ message: 'Seller profile not found.' });
			return;
		}

		const productId = req.params.productId;

		const result = await Product.destroy({
			where: { id: productId, sellerId: seller.id },
		});

		if (result === 0) {
			res.status(500).json({ message: 'Could not delete product' });
			return;
		}

		res.status(200).json({ message: 'Product deleted' });
	},
};

interface SellerController {
	getCurrentSellerProfile: RequestHandler;
	deleteCurrentSellerProfile: RequestHandler;

	createProduct: RequestHandler;
	getAllProducts: RequestHandler;
	getProductById: RequestHandler;
	updateProductById: RequestHandler;
	deleteAllProducts: RequestHandler;
	deleteProductById: RequestHandler;
}
