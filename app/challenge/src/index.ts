import { ENV_API_PORT, ENV_API_HOST } from './env.ts';

import orm, { ormInitModels, ORM_CONNECTION_STRING } from './orm/index.ts';

import { challenges as Challenges } from './orm/entities/index.ts';
import { challengesCreationAttributes as ChallengesCreatePayload } from './orm/entities/challenges.ts';

import express, { json as middleware_json } from 'express';
import { type Request, type Response, type NextFunction } from 'express';

function middleware_error_handler(
	err: any,
	req: Request,
	res: Response,
	next: NextFunction
) {
	console.error(err);

	res.sendStatus(500);
}
async function middleware_id_format(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const { id } = req.params;
	if (typeof id !== 'string') {
		res.sendStatus(400);
		return;
	}

	const re = new RegExp(/^[1-9][0-9]*$/);
	if (!re.test(id)) {
		res.sendStatus(404);
		return;
	}

	next();
}
async function middleware_id_exists(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const { id } = req.params;

	const challenge = await Challenges.findOne({ where: { id: Number(id) } });
	if (challenge === null) {
		res.sendStatus(404);
		res.end();

		return;
	}

	res.locals.challenge = challenge;
	next();
}

async function route_challenges_list(
	req: Request,
	res: Response
): Promise<void> {
	// TODO(xenobas): where, columns, limit, offset
	const challenges = await Challenges.findAll({
		order: [
			['id', 'ASC'],
			['name', 'ASC'],
		],
		attributes: {
			include: [
				'name',
				'description',
				'reward',
				'reward_min',
				'reward_first_blood',
				'reward_decrements',
			],
		},
		limit: 50,
		offset: 0,
	});
	console.log(challenges);

	res.header('Content-Type', 'application/json');
	res.status(200);
	res.send(JSON.stringify(challenges));
	res.end();
}
async function route_challenges_create(
	req: Request,
	res: Response
): Promise<void> {
	interface CreateOptions {
		name: string | number | boolean | undefined;
		description: string | number | boolean | undefined;
		reward: string | number | boolean | undefined;
		reward_min: string | number | boolean | undefined;
		reward_first_blood: string | number | boolean | undefined;
		reward_decrements: string | number | boolean | undefined;
	}
	const options: CreateOptions = req.body;

	const errors: { [field in keyof CreateOptions]?: string } = {};
	const tests: {
		[field in keyof CreateOptions]: (
			opt: string | number | boolean | undefined,
			opts?: CreateOptions
		) => {
			ok: boolean;
			error?: string;
		};
	} = {
		name(opt?: string | number | boolean): { ok: boolean; error?: string } {
			if (typeof opt !== 'string')
				return { ok: false, error: 'Must be a string' };
			if (opt.length === 0) return { ok: false, error: 'Must not be empty' };
			if (opt.length > 64) return { ok: false, error: 'Too large' };
			return { ok: true };
		},
		description(opt?: string | number | boolean): {
			ok: boolean;
			error?: string;
		} {
			if (typeof opt === 'undefined') return { ok: true };
			if (typeof opt !== 'string')
				return { ok: false, error: 'Must be a string' };
			if (opt.length === 0) return { ok: false, error: 'Must not be empty' };
			if (opt.length > 256) return { ok: false, error: 'Too large' };
			return { ok: true };
		},
		reward(
			opt?: string | number | boolean,
			opts?: CreateOptions
		): { ok: boolean; error?: string } {
			if (typeof opt === 'undefined') return { ok: true };
			if (typeof opt !== 'number')
				return { ok: false, error: 'Must be a number' };
			if (opt < 0) return { ok: false, error: 'Too low' };
			if (opt < (Number(opts?.reward_min) || -Infinity))
				return { ok: false, error: 'Too low' };
			return { ok: true };
		},
		reward_min(
			opt?: string | number | boolean,
			opts?: CreateOptions
		): { ok: boolean; error?: string } {
			if (typeof opt === 'undefined') return { ok: true };
			if (typeof opt !== 'number')
				return { ok: false, error: 'Must be a number' };
			if (opt < 0) return { ok: false, error: 'Too low' };
			return { ok: true };
		},
		reward_first_blood(
			opt?: string | number | boolean,
			opts?: CreateOptions
		): { ok: boolean; error?: string } {
			if (typeof opt === 'undefined') return { ok: true };
			if (typeof opt !== 'number')
				return { ok: false, error: 'Must be a number' };
			if (opt < 0) return { ok: false, error: 'Too low' };
			if (opt < (Number(opts?.reward_min) || -Infinity))
				return { ok: false, error: 'Too low' };
			return { ok: true };
		},
		reward_decrements(
			opt?: string | number | boolean,
			opts?: CreateOptions
		): { ok: boolean; error?: string } {
			if (typeof opt === 'undefined') return { ok: true };
			if (typeof opt !== 'boolean')
				return { ok: false, error: 'Must be a boolean' };
			return { ok: true };
		},
	};

	console.time('validation');
	let field: keyof CreateOptions;
	for (field in tests) {
		const { ok, error } = tests[field](options[field], options);
		if (!ok) errors[field] = error;
	}
	console.timeEnd('validation');

	if (Object.keys(errors).length > 0) {
		res.header('Content-Type', 'application/json');
		res.status(400);
		res.send(JSON.stringify({ errors }));
		res.end();

		return;
	}

	const values: ChallengesCreatePayload = {};
	if (typeof options.name === 'string') values.name = options.name;
	if (typeof options.description === 'string')
		values.description = options.description;
	if (typeof options.reward === 'number') values.reward = options.reward;
	if (typeof options.reward_min === 'number')
		values.reward_min = options.reward_min;
	if (typeof options.reward_first_blood === 'number')
		values.reward_first_blood = options.reward_first_blood;
	if (typeof options.reward_decrements === 'boolean')
		values.reward_decrements = options.reward_decrements;

	const challenge = await Challenges.create(values);

	res.header('Content-Type', 'application/json');
	res.status(200);
	res.send(JSON.stringify(challenge));
	res.end();
}
async function route_challenges_update(
	req: Request<{ id: string }>,
	res: Response
): Promise<void> {
	const { id } = req.params;
	const challenge = res.locals.challenge as Challenges;

	res.sendStatus(501);
	res.end();
}
async function route_challenges_inspect(
	req: Request<{ id: string }>,
	res: Response
): Promise<void> {
	const challenge = res.locals.challenge as Challenges;

	res.header('Content-Type', 'application/json');
	res.status(200);
	res.send(JSON.stringify(challenge));
	res.end();
}
async function route_challenges_delete(
	req: Request<{ id: string }>,
	res: Response
): Promise<void> {
	const { id } = res.locals.challenge as Challenges;

	await Challenges.destroy({ where: { id } });

	res.sendStatus(200);
	res.end();
}

const web = express();
web.use(middleware_error_handler);

// TODO(xenobas): Document how to generate the entities folder
// TODO(xenobas): Bulk delete
// TODO(xenobas): List filter/order options
// TODO(xenobas): Update

web.get('/api/challenges', route_challenges_list);
web.post(
	'/api/challenges',
	middleware_json({ limit: '8kb' }),
	route_challenges_create
);

web.put(
	'/api/challenges/:id',
	middleware_id_format,
	middleware_id_exists,
	route_challenges_update
);
web.get(
	'/api/challenges/:id',
	middleware_id_format,
	middleware_id_exists,
	route_challenges_inspect
);
web.delete(
	'/api/challenges/:id',
	middleware_id_format,
	middleware_id_exists,
	route_challenges_delete
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
