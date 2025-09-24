import { RequestHandler } from 'express';
import { CurriedFunction2 } from 'lodash';
import { curry } from 'lodash-es';

import { redisClient } from '@/config/redis';

export function cache(
	ttlSeconds: number,
	prefix: string = 'cache:',
): RequestHandler {
	return async (req, res, next) => {
		const key = `${prefix}:${req.originalUrl}`;

		try {
			const cached = await redisClient.get(key);
			if (cached) {
				console.log('cache hit: ', cached);
				return res.status(200).json(JSON.parse(cached));
			}

			const originalJson = res.json.bind(res);
			res.json = (body) => {
				if (res.statusCode < 400) {
					redisClient
						.setEx(key, ttlSeconds, JSON.stringify(body))
						.catch(console.error);
				}

				return originalJson(body);
			};

			return next();
		} catch (err) {
			console.error('Cache error:', err);
			return next();
		}
	};
}

export const cacheCurried = curry(cache, 2) as CurriedFunction2<
	number,
	string,
	RequestHandler
>;
