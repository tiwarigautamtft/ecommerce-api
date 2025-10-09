import {
	type GoogleCallbackParameters,
	type Profile,
	Strategy,
	type VerifyCallback,
} from 'passport-google-oauth20';

import { env, sequelize } from '.';

export const googleStrategy = new Strategy(
	{
		clientID: env.GOOGLE_CLIENT_ID,
		clientSecret: env.GOOGLE_CLIENT_SECRET,
		callbackURL: '/auth/login/google/callback',
	},
	() => {}
);