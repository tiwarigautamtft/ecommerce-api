import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import passport from 'passport';

export const authController: AuthController = {
	handleAuthCheck: (req, res) => {
		res.send(req.isAuthenticated() ? req.user.email : 'Not Authenticated');
	},

	handleGoogleLogin: passport.authenticate('google', {
		scope: ['openid', 'profile', 'email'],
	}),

	handleGoogleCallback: passport.authenticate('google', {
		successRedirect: '/',
		successMessage: true,

		failureRedirect: '/login',
		failureMessage: true,
	}),

	handleLogout: (req, res) =>
		req.logout((error) => {
			if (error) {
				req.user = undefined;
				console.error('User logged out manually');
			}

			res.status(StatusCodes.OK).json({ message: 'Logout Successful' });
		}),
};

interface AuthController {
	handleAuthCheck: RequestHandler;
	handleGoogleLogin: RequestHandler;
	handleGoogleCallback: RequestHandler;
	handleLogout: RequestHandler;
}
