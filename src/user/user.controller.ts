import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { emitter } from '@/lib/events/emitter';

import { User, UserEvent } from '.';

export const userController: UserController = {
	getCurrentUser: (req, res) => {
		res.json(req.user);
	},

	deleteCurrentUser: async (req, res) => {
		await User.destroy({ where: { id: req.user?.id } });

		emitter.emit(UserEvent.DELETED, req.user?.id);

		req.logout((error) => {
			if (error) {
				req.user = undefined;
				console.error('User logged out manually');
			} else {
				res
					.status(StatusCodes.OK)
					.json({ message: 'User deleted and logout successful' });
			}
		});
	},
};

interface UserController {
	getCurrentUser: RequestHandler;
	deleteCurrentUser: RequestHandler;
}
