import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { CurriedFunction2 } from 'lodash';
import { curry } from 'lodash-es';

import { redisClient } from '@/lib/config/redis';

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
				res.status(StatusCodes.OK).json(JSON.parse(cached));
				return;
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

			next();
		} catch (error) {
			console.error('Cache error:', error);
			next();
		}
	};
}

export const cacheCurried = curry(cache, 2) as CurriedFunction2<
	number,
	string,
	RequestHandler
>;
