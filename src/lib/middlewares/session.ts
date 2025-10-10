import { RedisStore } from 'connect-redis';
import { RequestHandler } from 'express';
import expressSession, { SessionOptions } from 'express-session';
import ms from 'ms';

import { env } from '@/lib/config/env';
import { redisClient } from '@/lib/config/redis';

const sessionOptions: SessionOptions = {
	name: 'sid',
	store: new RedisStore({
		client: redisClient,
		prefix: 'sess:',
		ttl: ms(env.SESSION_EXPIRY),
	}),
	secret: env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true,
	cookie: {
		secure: env.NODE_ENV === 'production',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: ms(env.SESSION_EXPIRY),
	},
};

export function session(): RequestHandler {
	return expressSession(sessionOptions);
}
