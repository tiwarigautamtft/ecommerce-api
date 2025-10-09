import { RequestHandler } from 'express';
import passport from 'passport';

export const authController: AuthController = {
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
		req.logout((err) => {
			if (err) {
				res.status(500).json({ message: 'Logout Failed', error: err });
				return;
			}
			res.status(200).json({ message: 'Logout Successful' });
		}),
};

interface AuthController {
	handleGoogleLogin: RequestHandler;
	handleGoogleCallback: RequestHandler;
	handleLogout: RequestHandler;
}