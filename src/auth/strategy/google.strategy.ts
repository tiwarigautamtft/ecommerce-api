import {
	type GoogleCallbackParameters,
	type Profile,
	Strategy,
	type VerifyCallback,
} from 'passport-google-oauth20';

import { OAuthAccount } from '@/auth/auth.model';
import { env } from '@/lib/config';
import { SessionUser } from '@/lib/types';
import { User } from '@/user/user.model';

import { Provider } from '../auth.enum';

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
		try {
			const sessionUser = await handleGoogleOAuth(profile);
			cb(null, sessionUser);
		} catch (error) {
			cb(error as Error);
		}
	},
);

async function handleGoogleOAuth(profile: Profile): Promise<SessionUser> {
	const oauthAccount = await findOAuthAccount(profile.id);
	const user = await findOrCreateUser(
		oauthAccount,
		extractEmail(profile),
		profile,
	);
	await ensureOAuthAccount(oauthAccount, profile, user.id);

	return createSessionUser(user);
}

async function findOrCreateUser(
	oauthAccount: OAuthAccount | null,
	email: string,
	profile: Profile,
): Promise<User> {
	if (oauthAccount) {
		const user = await User.scope('sessionUser').findByPk(oauthAccount.userId);
		if (user) return user;
	}

	const existingUser = await User.scope('sessionUser').findOne({
		where: { email },
	});
	if (existingUser) return existingUser;

	return createUserFromProfile(email, profile);
}

function createUserFromProfile(email: string, profile: Profile) {
	return User.create({
		email,
		emailVerified: extractEmailVerified(profile),
		name: profile.displayName,
		avatarUrl: extractAvatarUrl(profile),
	});
}

async function ensureOAuthAccount(
	existingOAuthAccount: OAuthAccount | null,
	profile: Profile,
	userId: string,
) {
	if (!existingOAuthAccount) {
		await OAuthAccount.create({
			provider: profile.provider as Provider,
			providerSub: profile.id,
			userId,
		});
	}
}

function createSessionUser(user: User): SessionUser {
	const sessionUser = user.toJSON() as SessionUser;
	sessionUser.roles = user.roles?.map((role) => role.name) || [];
	return sessionUser;
}

function findOAuthAccount(providerSub: string) {
	return OAuthAccount.findOne({
		where: { providerSub },
	});
}

function extractEmail(profile: Profile): string {
	return profile._json.email || profile.emails![0]!.value;
}

function extractEmailVerified(profile: Profile): boolean {
	return profile._json.email_verified || profile.emails![0]!.verified || false;
}

function extractAvatarUrl(profile: Profile): string | undefined {
	return profile._json.picture || profile.photos![0]!.value || undefined;
}
