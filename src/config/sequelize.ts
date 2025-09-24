import { Sequelize } from 'sequelize';

import { env } from './env';

const sequelize = new Sequelize(env.POSTGRES_URI);

(async () => {
	try {
		await sequelize.authenticate();
		console.log('Database connection setup successfully!');

		if (env.NODE_ENV === 'development') {
			try {
				await sequelize.sync({ alter: true });
				console.log('Database sync successful');
			} catch (error) {
				console.error("Couldn't sync database", error);
			}
		}
	} catch (error) {
		console.error('Unable to connect to the database', error);
	}
})();

export default sequelize;
