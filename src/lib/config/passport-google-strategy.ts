import {
	type GoogleCallbackParameters,
	type Profile,
	Strategy,
	type VerifyCallback,
} from 'passport-google-oauth20';

import { OAuthAccount, Provider } from '@/auth';
import { env, sequelize } from '@/lib/config';
import { User } from '@/user';

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
		let oauthAccount = await OAuthAccount.findOne({
			where: { providerSub: profile.id },
		});

		if (oauthAccount === null) {
			const results = await sequelize.transaction(async (transaction) => {
				const email = profile._json.email || profile.emails![0]!.value;
				const [user, _wasCreated] = await User.findOrCreate({
					where: {
						email,
					},
					defaults: {
						email,
						emailVerified:
							profile._json.email_verified ||
							profile.emails![0]!.verified ||
							false,
						name: profile.displayName,
						avatarUrl: profile._json.picture,
					},
					transaction,
				});

				oauthAccount = await OAuthAccount.create(
					{
						provider: profile.provider as Provider,
						providerSub: profile.id,
						userId: user.id,
					},
					{ transaction },
				);

				return user;
			});

			cb(null, results.dataValues);
		}

		if (oauthAccount === null) {
			cb(new Error("Couldn't create account. Try again"), false);
		} else {
			const user = await User.findByPk(oauthAccount.userId);

			if (user === null) {
				cb(new Error("Couldn't find user"), false);
			} else {
				cb(null, user.dataValues);
			}
		}
	},
);
