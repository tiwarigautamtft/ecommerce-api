import {
	type GoogleCallbackParameters,
	type Profile,
	Strategy,
	type VerifyCallback,
} from 'passport-google-oauth20';

import { OAuthAccount, Provider } from '@/auth';
import { env, sequelize } from '@/lib/config';
import { Role, UserRole } from '@/role';
import { User } from '@/user';

import { SessionUser } from '../types';

export const googleStrategy = new Strategy(
	{
		clientID: env.GOOGLE_CLIENT_ID,
		clientSecret: env.GOOGLE_CLIENT_SECRET,
		callbackURL: '/api/auth/login/google/callback',
	},
	async function (
		_accessToken: string,
		_refreshToken: string,
		_params: GoogleCallbackParameters,
		profile: Profile,
		cb: VerifyCallback,
	) {
		const email = profile._json.email || profile.emails![0]!.value;
		let sessionUser: SessionUser | null | undefined = null;

		let oauthAccount = await OAuthAccount.findOne({
			where: { providerSub: profile.id },
		});

		let existingUser: User | null = null;

		if (!oauthAccount) {
			// If no OAuthAccount, check if a user with the same email exists
			existingUser = await User.scope('sessionUser').findOne({
				where: { email },
			});
		} else {
			// If OAuthAccount exists, fetch the associated user
			existingUser = await User.scope('sessionUser').findByPk(
				oauthAccount.userId,
			);
		}

		// If no user exists, create a new one
		if (!existingUser) {
			const newUser = await User.create({
				email,
				emailVerified:
					profile._json.email_verified || profile.emails![0]!.verified || false,
				name: profile.displayName,
				avatarUrl: profile._json.picture,
			});

			const {
				createdAt: _,
				updatedAt: __,
				...userWithoutTimestamps
			} = newUser.toJSON();

			sessionUser = userWithoutTimestamps;
			sessionUser.roles = [];
		} else {
			sessionUser = existingUser.toJSON();
			sessionUser.roles = existingUser.roles?.map((role) => role.name);
		}

		if (!oauthAccount) {
			oauthAccount = await OAuthAccount.create({
				provider: profile.provider as Provider,
				providerSub: profile.id,
				userId: sessionUser.id,
			});
		}

		cb(null, sessionUser);
		return;
	},
);
