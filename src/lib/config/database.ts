import { devSync, sequelize } from './sequelize';

export function configDb() {
	devSync(sequelize);
}
