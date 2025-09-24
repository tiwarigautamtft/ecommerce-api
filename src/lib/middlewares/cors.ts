import Cors, { CorsOptions } from 'cors';
import { RequestHandler } from 'express';

const corsOptions: CorsOptions = {
	origin: ['http://localhost:5500'], // example client origin
	credentials: true,
};

export function cors(): RequestHandler {
	return Cors(corsOptions);
}
