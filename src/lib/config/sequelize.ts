import { Sequelize } from 'sequelize';

import { env } from './env';

export const sequelize = new Sequelize(env.POSTGRES_URI);

export const devSync = async (s: Sequelize) => {
	try {
		await s.authenticate();
		console.log('Database connection setup successfully!');

		if (env.NODE_ENV === 'development') {
			try {
				await s.sync({ alter: true });
				console.log('Database sync successful');
			} catch (error) {
				console.error("Couldn't sync database", error);
			}
		}
	} catch (error) {
		console.error('Unable to connect to the database', error);
	}
};
