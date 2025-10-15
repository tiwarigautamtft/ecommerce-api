import type { SessionUser } from '.';

// declare module 'express-serve-static-core' {
// 	interface User extends SessionUser {}
// 	interface Request {
// 		user?: SessionUser;
// 	}
// }

declare global {
	namespace Express {
		interface User extends SessionUser {}

		interface Request {
			user?: User;
		}
	}
}
