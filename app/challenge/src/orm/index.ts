import { Sequelize } from 'sequelize';
import { initModels } from './entities/init-models.ts';

import {
	ENV_DATABASE_HOST,
	ENV_DATABASE_PORT,
	ENV_DATABASE_USER,
	ENV_DATABASE_PASS,
	ENV_DATABASE_NAME,
} from '../env.ts';

const ORM_CONNECTION_STRING = `postgres://${ENV_DATABASE_USER}:${ENV_DATABASE_PASS}@${ENV_DATABASE_HOST}:${ENV_DATABASE_PORT}/${ENV_DATABASE_NAME}`;
const orm = new Sequelize(ORM_CONNECTION_STRING, {
	logging: false,
});

function ormInitModels() {
	return initModels(orm);
}

export { ormInitModels, ORM_CONNECTION_STRING };
export default orm;
