import { rateLimit } from 'express-rate-limit';
import ms from 'ms';
import { RedisStore, SendCommandFn } from 'rate-limit-redis';

import { env } from '@/lib/config/env';
import { redisClient } from '@/lib/config/redis';

const sendCommand: SendCommandFn = (...args: string[]) => {
	return redisClient.sendCommand(args);
};

const rateLimiterStores = {
	global: new RedisStore({
		prefix: 'rl:global:',
		sendCommand
	}),
	auth: new RedisStore({
		prefix: 'rl:auth:',
		sendCommand,
	}),
	upload: new RedisStore({
		prefix: 'rl:upload:',
		sendCommand,
	}),
	api: new RedisStore({
		prefix: 'rl:api:',
		sendCommand,
	}),
};

const globalRateLimit = rateLimit({
	store: rateLimiterStores.global,
	windowMs: ms(env.RATE_LIMIT_WINDOW_MS),
	max: parseInt(env.RATE_LIMIT_WINDOW_MAX),
	message: {
		error: 'Too many requests from this IP, please try again later.',
		retryAfter: ms(ms(env.RATE_LIMIT_WINDOW_MS), { long: true }),
	},
	standardHeaders: true,
	handler: (_req, res, _next, options) => {
		res.status(options.statusCode).json(options.message);
	},
});

const authRateLimit = rateLimit({
	store: rateLimiterStores.auth,
	windowMs: ms(env.AUTH_RATE_LIMIT_WINDOW_MS),
	max: parseInt(env.AUTH_RATE_LIMIT_WINDOW_MAX),
	message: {
		error:
			'Too many authentication attempts from this IP, please try again later.',
		retryAfter: ms(ms(env.AUTH_RATE_LIMIT_WINDOW_MS), { long: true }),
	},
	standardHeaders: true,
	skipSuccessfulRequests: true, // Don't count successful requests
	handler: (_req, res, _next, options) => {
		res.status(options.statusCode).json(options.message);
	},
});

const uploadRateLimit = rateLimit({
	store: rateLimiterStores.upload,
	windowMs: ms(env.UPLOAD_RATE_LIMIT_WINDOW_MS),
	max: parseInt(env.UPLOAD_RATE_LIMIT_WINDOW_MAX),
	message: {
		error: 'Too many upload attempts, please try again later.',
		retryAfter: ms(ms(env.UPLOAD_RATE_LIMIT_WINDOW_MS), { long: true }),
	},
	standardHeaders: true,
	legacyHeaders: false,
});

const apiRateLimit = rateLimit({
	store: rateLimiterStores.api,
	windowMs: ms(env.API_RATE_LIMIT_WINDOW_MS),
	max: parseInt(env.API_RATE_LIMIT_WINDOW_MAX),
	message: {
		error: 'API rate limit exceeded, please try again later.',
		retryAfter: ms(ms(env.API_RATE_LIMIT_WINDOW_MS), { long: true }),
	},
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => {
		// Skip rate limiting for admin users
		return !!req.user && req.user.role === 'admin';
	},
});

export { globalRateLimit, authRateLimit, uploadRateLimit, apiRateLimit };
