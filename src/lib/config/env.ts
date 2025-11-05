import { configDotenv } from 'dotenv';
import ms, { StringValue } from 'ms';
import z from 'zod';

configDotenv();

const StringValueSchema = z.custom<StringValue>(
	(val) => typeof val === 'string' && !!ms(val as StringValue),
);

enum NodeEnv {
	DEVELOPMENT = 'development',
	PRODUCTION = 'production',
	TEST = 'test',
	STAGING = 'staging',
}

const EnvSchema = z
	.object({
		NODE_ENV: z.enum([...Object.values(NodeEnv)]),
		PORT: z.coerce.number().min(1).max(65535),

		DB_NAME: z.string(),
		DB_URL: z.url(),
		DB_USERNAME: z.string(),
		DB_PASSWORD: z.string(),
		DB_DIALECT: z.string(),

		SESSION_SECRET: z.string(),
		SESSION_EXPIRY: StringValueSchema,

		GOOGLE_CLIENT_ID: z.string(),
		GOOGLE_CLIENT_SECRET: z.string(),

		GOOGLE_AI_MODEL: z.string(),
		GOOGLE_AI_API_KEY: z.string(),

		REDIS_URL: z.url(),

		RATE_LIMIT_WINDOW_MS: StringValueSchema,
		RATE_LIMIT_WINDOW_MAX: z.coerce.number(),

		AUTH_RATE_LIMIT_WINDOW_MS: StringValueSchema,
		AUTH_RATE_LIMIT_WINDOW_MAX: z.coerce.number(),

		UPLOAD_RATE_LIMIT_WINDOW_MS: StringValueSchema,
		UPLOAD_RATE_LIMIT_WINDOW_MAX: z.coerce.number(),

		API_RATE_LIMIT_WINDOW_MS: StringValueSchema,
		API_RATE_LIMIT_WINDOW_MAX: z.coerce.number(),

		// CLOUDINARY_CLOUD_NAME: z.string(),
		// CLOUDINARY_API_KEY: z.string(),
		// CLOUDINARY_API_SECRET: z.string(),
	})
	.transform((env) => ({
		...env,
		isProd: env.NODE_ENV === NodeEnv.PRODUCTION,
		isDev: env.NODE_ENV === NodeEnv.DEVELOPMENT,
		isTest: env.NODE_ENV === NodeEnv.TEST,
	}));

export const env = EnvSchema.parse(process.env);
