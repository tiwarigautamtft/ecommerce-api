import { type RedisClientType, createClient } from 'redis';

import { env } from './env';

export const redisClient: RedisClientType = createClient({
	url: env.REDIS_URL,
	socket: {
		reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
	},
});

redisClient.on('error', (err) => {
	console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
	console.log('Redis Client Connected');
});

redisClient.on('ready', () => {
	console.log('Redis Client Ready');
});

redisClient.on('end', () => {
	console.log('Redis Client Disconnected');
});

(async () => {
	try {
		await redisClient.connect();
	} catch (error) {
		console.error('Failed to connect to Redis:', error);
	}
})();