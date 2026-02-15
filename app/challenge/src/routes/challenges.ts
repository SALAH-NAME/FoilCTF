import * as vb from 'valibot';
import { type Request, type Response } from 'express';

import { challenges as Challenges } from '../orm/index.ts';
import { respondJSON, respondStatus } from '../web.ts';
import {
	schema_challenge_create,
	schema_challenge_update,
	schema_pagination,
} from '../schemas.ts';

export async function route_challenges_list(
	req: Request,
	res: Response
): Promise<void> {
	const parse_result = vb.safeParse(schema_pagination, req.query);
	if (!parse_result.success) {
		const { issues: errors } = parse_result;
		return respondJSON(res, { errors }, 400);
	}

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
		limit: parse_result.output.limit,
		offset: parse_result.output.offset,
	});
	respondJSON(res, challenges);
}
export async function route_challenges_delete(
	_req: Request,
	res: Response
): Promise<void> {
	// TODO(xenobas): Bulk delete
	respondStatus(res, 501);
}

export async function route_challenge_create(
	req: Request,
	res: Response
): Promise<void> {
	const parse_result = await vb.safeParseAsync(
		schema_challenge_create,
		req.body
	);
	if (!parse_result.success) {
		const { issues: errors } = parse_result;
		return respondJSON(res, { errors }, 400);
	}

	const challenge = await Challenges.create(parse_result.output);
	respondJSON(res, { challenge }, 201);
}
export async function route_challenge_update(
	req: Request<{ id: string }>,
	res: Response<any, { challenge: Challenges }>
): Promise<void> {
	const challenge = res.locals.challenge;

	const parse_result = await vb.safeParseAsync(
		schema_challenge_update,
		req.body
	);
	if (!parse_result.success) {
		const { issues: errors } = parse_result;
		return respondJSON(res, { errors }, 400);
	}

	try {
		await challenge.update(parse_result.output);
		respondStatus(res, 200);
	} catch (error) {
		console.error(`Could not update challenge#${challenge.id}:`, error);
		respondStatus(res, 400);
	}
}
export async function route_challenge_delete(
	_req: Request<{ id: string }>,
	res: Response<any, { challenge: Challenges }>
): Promise<void> {
	const { id } = res.locals.challenge;
	await Challenges.destroy({ where: { id } });

	respondStatus(res, 200);
}
export async function route_challenge_inspect(
	_req: Request<{ id: string }>,
	res: Response<any, { challenge: Challenges }>
): Promise<void> {
	const challenge = res.locals.challenge as Challenges;

	respondJSON(res, { challenge }, 200);
}
