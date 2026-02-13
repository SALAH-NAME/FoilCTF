import express, { request as app_req } from 'express';

import { ENV_API_PORT, ENV_API_HOST } from './env.ts';
import orm, { ormInitModels, ORM_CONNECTION_STRING } from './orm/index.ts';

import {
	middleware_cors,
	middleware_json,
	middleware_error,
	middleware_metric_reqs,
	middleware_id_format,
	middleware_attachment_exists,
	middleware_challenge_exists,
	middleware_not_found,
} from './middlewares.ts';

import { route_health } from './routes/health.ts';
import { route_metrics } from './routes/metrics.ts';

import {
	route_challenges_list,
	route_challenges_delete,
	route_challenge_create,
	route_challenge_update,
	route_challenge_inspect,
	route_challenge_delete,
} from './routes/challenges.ts';

import {
	route_attachments_list,
	route_attachment_create,
	route_attachment_delete,
} from './routes/attachments.ts';

const web = express();

web.use(middleware_cors);

web.get('/health', route_health);
web.get('/metrics', route_metrics);

web.use(middleware_metric_reqs);

// SECTION: Bulk actions
web.get('/api/challenges', route_challenges_list);
web.delete(
	'/api/challenges',
	middleware_json({ limit: '8kb' }),
	route_challenges_delete
);

// SECTION: Per Challenge actions
web.get(
	'/api/challenges/:challenge_id',
	middleware_id_format('challenge_id'),
	middleware_challenge_exists,
	route_challenge_inspect
);
web.post(
	'/api/challenges',
	middleware_json({ limit: '8kb' }),
	route_challenge_create
);
web.put(
	'/api/challenges/:challenge_id',
	middleware_id_format('challenge_id'),
	middleware_challenge_exists,
	middleware_json({ limit: '8kb' }),
	route_challenge_update
);
web.delete(
	'/api/challenges/:challenge_id',
	middleware_id_format('challenge_id'),
	middleware_challenge_exists,
	route_challenge_delete
);

// SECTION: Attachments
web.get(
	'/api/challenges/:challenge_id/attachments',
	middleware_id_format('challenge_id'),
	middleware_challenge_exists,
	route_attachments_list
);
web.post(
	'/api/challenges/:challenge_id/attachments',
	middleware_id_format('challenge_id'),
	middleware_challenge_exists,
	middleware_json({ limit: '4kb' }),
	route_attachment_create
);
web.delete(
	'/api/challenges/:challenge_id/attachments/:attachment_id',
	middleware_id_format('challenge_id', 'attachment_id'),
	middleware_challenge_exists,
	middleware_attachment_exists,
	route_attachment_delete
);

web.use(middleware_not_found);
web.use(middleware_error); // NOTE(xenobas): This must be always the last middleware, in order to guarantee that it catches all exceptions

try {
	await orm.authenticate();
	console.log('DATABASE established connection at', ORM_CONNECTION_STRING);

	ormInitModels();
} catch (error) {
	console.error('Could not establish connection to the database:', error);
	process.exit(1);
}

web.listen(ENV_API_PORT, ENV_API_HOST, (error?: Error) => {
	if (error) {
		console.error(error);
		return;
	}

	console.log(`REST API listening on port ${ENV_API_PORT}`);
});
