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
	const models = initModels(orm);

	models.challenges_attachments.belongsTo(models.challenges, {
		targetKey: 'id',
		foreignKey: 'challenge_id',
	});
	models.challenges_attachments.belongsTo(models.attachments, {
		targetKey: 'id',
		foreignKey: 'attachment_id',
	});

	return models;
}

export { ormInitModels, ORM_CONNECTION_STRING };
export * from './entities/init-models.ts';
export default orm;
