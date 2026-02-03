import express from 'express';

import { ENV_API_PORT, ENV_API_HOST } from './env.ts';
import orm, { ormInitModels, ORM_CONNECTION_STRING } from './orm/index.ts';

import {
	middleware_error,
	middleware_json,
	middleware_id_format,
	middleware_id_exists,
} from './middlewares.ts';

import {
	route_challenges_list,
	route_challenges_delete,
	route_challenge_create,
	route_challenge_update,
	route_challenge_inspect,
	route_challenge_delete,
} from './routes/challenges.ts';

import {
	route_attachment_create,
	route_attachments_list,
} from './routes/attachments.ts';

const web = express();

// SECTION: Bulk actions
web.get('/api/challenges', route_challenges_list);
web.delete(
	'/api/challenges',
	middleware_json({ limit: '8kb' }),
	route_challenges_delete
);

// SECTION: Per Challenge actions
web.get(
	'/api/challenges/:id',
	middleware_id_format,
	middleware_id_exists,
	route_challenge_inspect
);
web.post(
	'/api/challenges',
	middleware_json({ limit: '8kb' }),
	route_challenge_create
);
web.put(
	'/api/challenges/:id',
	middleware_id_format,
	middleware_id_exists,
	middleware_json({ limit: '8kb' }),
	route_challenge_update
);
web.delete(
	'/api/challenges/:id',
	middleware_id_format,
	middleware_id_exists,
	route_challenge_delete
);

// SECTION: Attachments
web.get(
	'/api/challenges/:id/attachments',
	middleware_id_format,
	middleware_id_exists,
	route_attachments_list
);
web.post(
	'/api/challenges/:id/attachments',
	middleware_id_format,
	middleware_id_exists,
	middleware_json({ limit: '4kb' }),
	middleware_error,
	route_attachment_create
);

try {
	await orm.authenticate();
	console.log('DATABASE established connection at', ORM_CONNECTION_STRING);

	ormInitModels();
} catch (error) {
	console.error('Could not establish connection to the database:', error);
	process.exit(1);
}

web.listen(ENV_API_PORT, ENV_API_HOST, () => {
	console.log(`REST API listening on port ${ENV_API_PORT}`);
});
