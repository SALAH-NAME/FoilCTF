import { join } from 'node:path';
import { stdin, stdout, exit } from 'node:process';
import { createInterface } from 'node:readline/promises';

import SequelizeAuto from 'sequelize-auto';
import {
	ENV_DATABASE_HOST,
	ENV_DATABASE_PORT,
	ENV_DATABASE_USER,
	ENV_DATABASE_PASS,
	ENV_DATABASE_NAME,
} from '../src/env.ts';

// TODO(xenobas): Completer interface
// const rl = createInterface({ input: stdin, output: stdout });
// const directory = await rl.question('Choose an output directory: ');
// rl.close();
const directory = './src/orm/entities';

const instance = new SequelizeAuto(
	ENV_DATABASE_NAME,
	ENV_DATABASE_USER,
	ENV_DATABASE_PASS,
	{
		host: ENV_DATABASE_HOST,
		port: ENV_DATABASE_PORT,
		dialect: 'postgres',

		caseModel: 'o',
		caseProp: 'o',
		caseFile: 'p',
		directory,

		lang: 'ts',
		useDefine: false,

		singularize: false,
		additional: {
			timestamps: false,
		},
	}
);

try {
	const stats = await instance.run();

	console.log('-', Object.keys(stats.tables ?? {}).length, 'tables');
	console.log(
		'-',
		Object.keys(stats.hasTriggerTables ?? {}).length,
		'tables with triggers'
	);
	console.log('-', Object.keys(stats.indexes ?? {}).length, 'indexes');
	console.log(
		'-',
		Object.keys(stats.relations ?? {}).length,
		'relationships between models'
	);
	console.log('-', Object.keys(stats.foreignKeys ?? {}).length, 'foreign keys');

	console.warn(
		`All relative file imports in ${directory}/init-models.ts should be changed to include the '.ts' extension.`
	);
} catch (error) {
	console.error(error);
	console.error(
		'An error has occurred while generating the entity model files'
	);
	exit(1);
}
