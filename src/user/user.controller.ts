import { RequestHandler } from 'express';

export const userController: UserController = {
	getUser: (req, res) => {
		res.send('get a user');
	},
	updateUser: (req, res) => {
		res.send('update user');
	},
	deleteUser: (req, res) => {
		res.send('delete user');
	},
	getCurrentUserProfile: (req, res) => {
		res.json(req.user);
	},
};

interface UserController {
	getUser: RequestHandler;
	updateUser: RequestHandler;
	deleteUser: RequestHandler;
	getCurrentUserProfile: RequestHandler;
}