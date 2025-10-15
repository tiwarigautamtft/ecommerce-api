import { RequestHandler } from 'express';
import passport from 'passport';

import { googleStrategy } from '@/lib/config';

passport.use(googleStrategy);

passport.serializeUser((user, done) => {
	// console.log('serializing user', user);
	done(null, user);
});

passport.deserializeUser((user: any, done) => {
	// console.log('DE-serializing user', user);
	done(null, user);
});

function passportMiddleware(): RequestHandler[] {
	return [passport.initialize(), passport.session()];
}

export { passportMiddleware as passport };
