import { configDotenv } from 'dotenv';
import { StringValue } from 'ms';

configDotenv();

export const env = {
	NODE_ENV: getEnvVar('NODE_ENV'),
	PORT: getEnvVar('PORT'),

	POSTGRES_URI: getEnvVar('POSTGRES_URI'),

	SESSION_SECRET: getEnvVar('SESSION_SECRET'),
	SESSION_EXPIRY: getEnvVar('SESSION_EXPIRY') as StringValue,

	GOOGLE_CLIENT_ID: getEnvVar('GOOGLE_CLIENT_ID'),
	GOOGLE_CLIENT_SECRET: getEnvVar('GOOGLE_CLIENT_SECRET'),

	REDIS_URL: getEnvVar('REDIS_URL'),

	RATE_LIMIT_WINDOW_MS: getEnvVar('RATE_LIMIT_WINDOW_MS') as StringValue,
	RATE_LIMIT_WINDOW_MAX: getEnvVar('RATE_LIMIT_WINDOW_MAX'),

	AUTH_RATE_LIMIT_WINDOW_MS: getEnvVar(
		'AUTH_RATE_LIMIT_WINDOW_MS',
	) as StringValue,
	AUTH_RATE_LIMIT_WINDOW_MAX: getEnvVar('AUTH_RATE_LIMIT_WINDOW_MAX'),

	UPLOAD_RATE_LIMIT_WINDOW_MS: getEnvVar(
		'UPLOAD_RATE_LIMIT_WINDOW_MS',
	) as StringValue,
	UPLOAD_RATE_LIMIT_WINDOW_MAX: getEnvVar('UPLOAD_RATE_LIMIT_WINDOW_MAX'),

	API_RATE_LIMIT_WINDOW_MS: getEnvVar(
		'API_RATE_LIMIT_WINDOW_MS',
	) as StringValue,
	API_RATE_LIMIT_WINDOW_MAX: getEnvVar('API_RATE_LIMIT_WINDOW_MAX'),

	CLOUDINARY_CLOUD_NAME: getEnvVar('CLOUDINARY_CLOUD_NAME'),
	CLOUDINARY_API_KEY: getEnvVar('CLOUDINARY_API_KEY'),
	CLOUDINARY_API_SECRET: getEnvVar('CLOUDINARY_API_SECRET'),
};

function getEnvVar(key: string): string {
	if (!process.env[key])
		throw new Error(`Environment variable \`${key}\` not found`);
	return process.env[key];
}
