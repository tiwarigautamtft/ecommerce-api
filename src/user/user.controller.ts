import assert from 'assert';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { userService } from './user.service';

export const userController: UserController = {
	getSessionUser: (req, res) => {
		res.json(req.user);
	},

	deleteCurrentUser: async (req, res) => {
		assert(req.user, 'User must be authenticated');

		await userService.deleteUserById(req.user.id);

		req.logout((error) => {
			if (error) {
				req.user = undefined;
				console.error('User logged out manually:', error);
				res
					.status(StatusCodes.OK)
					.json({ message: 'User deleted. Logged out manually' });
			} else {
				res
					.status(StatusCodes.OK)
					.json({ message: 'User deleted and logout successful' });
			}
		});
	},
};

interface UserController {
	getSessionUser: RequestHandler;
	deleteCurrentUser: RequestHandler;
}
