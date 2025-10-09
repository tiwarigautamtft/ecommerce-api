import { devSync, sequelize } from './sequelize';
import { defineAssociations } from './sequelize-associations';

devSync(sequelize);
defineAssociations();
