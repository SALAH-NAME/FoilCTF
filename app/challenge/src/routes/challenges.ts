import { type Request, type Response } from 'express';
import {
	check_object,
	check_string,
	check_number,
	check_boolean,
	parse_errors_count,
	type ParseErrors,
	type ParseResult,
} from '../parse.ts';

import {
	users as Users,
	challenges as Challenges,
	challengesCreationAttributes as PayloadChallengeCreate,
} from '../orm/entities/init-models.ts';

export async function route_challenges_list(
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
export async function route_challenges_delete(
	req: Request,
	res: Response
): Promise<void> {
	// TODO(xenobas): Bulk delete
	res.sendStatus(501);
	res.end();
}

async function parse_challenge_upsert(
	body: Record<string, any> | undefined,
	prev_challenge?: Challenges
): Promise<ParseResult<PayloadChallengeCreate>> {
	const errors: ParseErrors<PayloadChallengeCreate> = {};
	if (body === undefined) {
		errors['body'] = 'Must not be empty';
		return { ok: false, errors };
	}

	errors['name'] = check_string(body['name'], {
		min_length: 4,
		max_length: 64,
		allow_undefined: true,
	});
	errors['description'] = check_string(body['description'], {
		min_length: 4,
		max_length: 256,
		allow_undefined: true,
	});

	errors['author_id'] = check_string(body['author_id'], {
		min_length: 1,
		max_length: 64,
		allow_undefined: !!prev_challenge,
	});
	errors['is_published'] = check_boolean(body['is_published'], {
		allow_undefined: true,
	});

	errors['reward'] = check_number(body['reward'], {
		min: 0,
		allow_undefined: true,
	});
	errors['reward_min'] = check_number(body['reward_min'], {
		min: 0,
		allow_undefined: true,
	});
	errors['reward_first_blood'] = check_number(body['reward_min'], {
		min: 0,
		allow_undefined: true,
	});
	errors['reward_decrements'] = check_boolean(body['reward_decrements'], {
		allow_undefined: true,
	});
	if (parse_errors_count(errors) > 0) return { ok: false, errors };

	const name = body['name'] as string | undefined;
	const description = body['description'] as string | undefined;

	const author_id = body['author_id'] as string;
	const is_published = body['is_published'] as boolean | undefined;

	const reward = body['reward'] as number | undefined;
	const reward_min = body['reward_min'] as number | undefined;
	const reward_first_blood = body['reward_first_blood'] as number | undefined;
	const reward_decrements = body['reward_decrements'] as boolean | undefined;

	if (typeof body['author_id'] === 'string') {
		const author = await Users.findOne({ where: { id: body['author_id'] } });
		if (author === null) {
			errors['author_id'] = "User doesn't exist";
		}
	}
	if (typeof reward === 'number') {
		if (typeof reward_min === 'number' && reward < reward_min) {
			errors['reward'] = 'Lower than payload reward_min';
		} else if (reward < (prev_challenge?.reward_min ?? -Infinity)) {
			errors['reward'] = 'Lower than already set reward_min';
		}
	}
	if (typeof reward_min === 'number') {
		if (reward_min > (prev_challenge?.reward ?? +Infinity)) {
			errors['reward_min'] = 'Lower than already set reward';
		}
	}
	if (parse_errors_count(errors) > 0) return { ok: false, errors };

	return {
		ok: true,
		payload: {
			name,
			description,

			author_id,
			is_published,

			reward,
			reward_min,
			reward_first_blood,
			reward_decrements,
		},
	};
}
export async function route_challenge_create(
	req: Request,
	res: Response
): Promise<void> {
	const parse_result = await parse_challenge_upsert(req.body);
	if (!parse_result.ok) {
		const { errors } = parse_result;
		res.status(400);
		res.header('Content-Type', 'application/json');
		res.send(JSON.stringify({ errors }));
		res.end();

		return;
	}

	const challenge = await Challenges.create(parse_result.payload);

	res.header('Content-Type', 'application/json');
	res.status(201);
	res.send(JSON.stringify(challenge));
	res.end();
}
export async function route_challenge_update(
	req: Request<{ id: string }>,
	res: Response
): Promise<void> {
	const challenge = res.locals.challenge as Challenges;

	const parse_result = await parse_challenge_upsert(req.body, challenge);
	if (!parse_result.ok) {
		const { errors } = parse_result;
		res.status(400);
		res.header('Content-Type', 'application/json');
		res.send(JSON.stringify({ errors }));
		res.end();

		return;
	}

	try {
		await challenge.update(parse_result.payload);
		res.sendStatus(200);
	} catch (error) {
		console.error(`Could not update challenge#${challenge.id}:`, error);
		res.sendStatus(400);
	}
	res.end();
}
export async function route_challenge_delete(
	req: Request<{ id: string }>,
	res: Response
): Promise<void> {
	const { id } = res.locals.challenge as Challenges;

	await Challenges.destroy({ where: { id } });

	res.sendStatus(200);
	res.end();
}
export async function route_challenge_inspect(
	req: Request<{ id: string }>,
	res: Response
): Promise<void> {
	const challenge = res.locals.challenge as Challenges;

	res.header('Content-Type', 'application/json');
	res.status(200);
	res.send(JSON.stringify(challenge));
	res.end();
}
