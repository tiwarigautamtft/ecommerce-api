import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import passport from 'passport';

export const authController: AuthController = {
	handleAuthCheck: (req, res) => {
		res.send(
			req.isAuthenticated()
				? req.user.email
				: 'Not Authenticated<br/><a href="/api/auth/login/google">Login with Google</a>',
		);
	},

	handleGoogleLogin: passport.authenticate('google', {
		scope: ['openid', 'profile', 'email'],
	}),

	handleGoogleCallback: passport.authenticate('google', {
		successRedirect: '/',
		successMessage: true,

		failureRedirect: '/',
		failureMessage: true,
	}),

	handleLogout: (req, res) =>
		req.logout((error) => {
			if (error) {
				req.user = undefined;
				console.error('User logged out manually', error);
				res
					.status(StatusCodes.OK)
					.json({ message: 'Manual Logout Successful' });
			} else {
				res.status(StatusCodes.OK).json({ message: 'Logout Successful' });
			}
		}),
};

interface AuthController {
	handleAuthCheck: RequestHandler;
	handleGoogleLogin: RequestHandler;
	handleGoogleCallback: RequestHandler;
	handleLogout: RequestHandler;
}
