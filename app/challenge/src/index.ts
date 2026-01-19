import express from 'express';
import { type Request, type Response, type NextFunction } from 'express';

import { ENV_API_PORT, ENV_API_HOST } from './env.ts';
import orm, { ormInitModels, ORM_CONNECTION_STRING } from './orm/index.ts';
import {
	challenges as Challenges,
	challengesCreationAttributes as ChallengesCreatePayload,
} from './orm/entities/init-models.ts';

import {
	middleware_error_handler,
	middleware_id_format,
	middleware_id_exists,
	middleware_json,
} from './middlewares.ts';

async function route_challenges_list(
	req: Request,
	res: Response
): Promise<void> {
	// TODO(xenobas): List filter/order options
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

	res.header('Content-Type', 'application/json');
	res.status(200);
	res.send(JSON.stringify(challenges));
	res.end();
}
async function route_challenges_delete(
	req: Request,
	res: Response
): Promise<void> {
	// TODO(xenobas): Bulk delete
	res.sendStatus(501);
	res.end();
}

async function route_challenge_create(
	req: Request,
	res: Response
): Promise<void> {
	interface JSONPayload {
		name: string | number | boolean | undefined;
		description: string | number | boolean | undefined;
		reward: string | number | boolean | undefined;
		reward_min: string | number | boolean | undefined;
		reward_first_blood: string | number | boolean | undefined;
		reward_decrements: string | number | boolean | undefined;
	}
	const options: JSONPayload = req.body;

	const errors: { [field in keyof JSONPayload]?: string } = {};
	const tests: {
		[field in keyof JSONPayload]: (
			opt: string | number | boolean | undefined,
			opts?: JSONPayload
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
			opts?: JSONPayload
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
			opts?: JSONPayload
		): { ok: boolean; error?: string } {
			if (typeof opt === 'undefined') return { ok: true };
			if (typeof opt !== 'number')
				return { ok: false, error: 'Must be a number' };
			if (opt < 0) return { ok: false, error: 'Too low' };
			return { ok: true };
		},
		reward_first_blood(
			opt?: string | number | boolean,
			opts?: JSONPayload
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
			opts?: JSONPayload
		): { ok: boolean; error?: string } {
			if (typeof opt === 'undefined') return { ok: true };
			if (typeof opt !== 'boolean')
				return { ok: false, error: 'Must be a boolean' };
			return { ok: true };
		},
	};

	let field: keyof JSONPayload;
	for (field in tests) {
		const { ok, error } = tests[field](options[field], options);
		if (!ok) errors[field] = error;
	}

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
	res.status(201);
	res.send(JSON.stringify(challenge));
	res.end();
}
async function route_challenge_update(
	req: Request<{ id: string }>,
	res: Response
): Promise<void> {
	const challenge = res.locals.challenge as Challenges;

	interface JSONPayload {
		name: string | number | boolean | undefined;
		description: string | number | boolean | undefined;
		reward: string | number | boolean | undefined;
		reward_min: string | number | boolean | undefined;
		reward_first_blood: string | number | boolean | undefined;
		reward_decrements: string | number | boolean | undefined;
	}
	const options: JSONPayload = req.body;

	const errors: { [field in keyof JSONPayload]?: string } = {};
	const tests: {
		[field in keyof JSONPayload]: (
			opt: string | number | boolean | undefined,
			opts?: JSONPayload
		) => {
			ok: boolean;
			error?: string;
		};
	} = {
		name(opt?: string | number | boolean): { ok: boolean; error?: string } {
			if (typeof opt === 'undefined') return { ok: true };
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
			opts?: JSONPayload
		): { ok: boolean; error?: string } {
			if (typeof opt === 'undefined') return { ok: true };
			if (typeof opt !== 'number')
				return { ok: false, error: 'Must be a number' };
			if (opt < 0) return { ok: false, error: 'Too low' };
			if (opt < (Number(opts?.reward_min) || -Infinity))
				return { ok: false, error: 'Too low' };
			if (typeof opts?.reward_min === 'undefined' && opt < challenge.reward_min)
				return { ok: false, error: 'Too low' };
			return { ok: true };
		},
		reward_min(
			opt?: string | number | boolean,
			opts?: JSONPayload
		): { ok: boolean; error?: string } {
			if (typeof opt === 'undefined') return { ok: true };
			if (typeof opt !== 'number')
				return { ok: false, error: 'Must be a number' };
			if (opt < 0) return { ok: false, error: 'Too low' };
			return { ok: true };
		},
		reward_first_blood(
			opt?: string | number | boolean,
			opts?: JSONPayload
		): { ok: boolean; error?: string } {
			if (typeof opt === 'undefined') return { ok: true };
			if (typeof opt !== 'number')
				return { ok: false, error: 'Must be a number' };
			if (opt < 0) return { ok: false, error: 'Too low' };
			if (opt < (Number(opts?.reward_min) || -Infinity))
				return { ok: false, error: 'Too low' };
			if (typeof opts?.reward_min === 'undefined' && opt < challenge.reward_min)
				return { ok: false, error: 'Too low' };
			return { ok: true };
		},
		reward_decrements(
			opt?: string | number | boolean,
			opts?: JSONPayload
		): { ok: boolean; error?: string } {
			if (typeof opt === 'undefined') return { ok: true };
			if (typeof opt !== 'boolean')
				return { ok: false, error: 'Must be a boolean' };
			return { ok: true };
		},
	};

	let field: keyof JSONPayload;
	for (field in tests) {
		const { ok, error } = tests[field](options[field], options);
		if (!ok) errors[field] = error;
	}

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

	try {
		await challenge.update(values);
		res.sendStatus(200);
	} catch (error) {
		console.error(`Could not update challenge#${challenge.id}:`, error);
		res.sendStatus(400);
	}
	res.end();
}
async function route_challenge_inspect(
	req: Request<{ id: string }>,
	res: Response
): Promise<void> {
	const challenge = res.locals.challenge as Challenges;

	res.header('Content-Type', 'application/json');
	res.status(200);
	res.send(JSON.stringify(challenge));
	res.end();
}
async function route_challenge_delete(
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

// SECTION: Bulk actions
web.get('/api/challenges', route_challenges_list);
web.delete(
	'/api/challenges',
	middleware_json({ limit: '8kb' }),
	route_challenges_delete
);

// SECTION: Per Challenge actions
web.post(
	'/api/challenges',
	middleware_json({ limit: '8kb' }),
	route_challenge_create
);
web.get(
	'/api/challenges/:id',
	middleware_id_format,
	middleware_id_exists,
	route_challenge_inspect
);
web.put(
	'/api/challenges/:id',
	middleware_json({ limit: '8kb' }),
	middleware_id_format,
	middleware_id_exists,
	route_challenge_update
);
web.delete(
	'/api/challenges/:id',
	middleware_id_format,
	middleware_id_exists,
	route_challenge_delete
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
