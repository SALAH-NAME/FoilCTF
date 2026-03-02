import * as vb from 'valibot';
import { count, eq, ilike  } from 'drizzle-orm';
import { type Request, type Response } from 'express';
import { createSelectSchema, createInsertSchema, createUpdateSchema } from 'drizzle-valibot'

import { schema_pagination } from '../schemas.js';
import { respondJSON, respondStatus } from '../web.js';
import orm, { challenges as table_challenges } from '../orm/index.js';

export const valibot_select_challenge = createSelectSchema(table_challenges);
export const valibot_insert_challenge = createInsertSchema(table_challenges);
export const valibot_update_challenge = createUpdateSchema(table_challenges);

export type SelectChallenge = vb.InferOutput<typeof valibot_select_challenge>;

export async function route_challenges_list(
	req: Request,
	res: Response
): Promise<void> {
	const parse_result = vb.safeParse(schema_pagination, req.query);
	if (!parse_result.success) {
		const { issues: errors } = parse_result;
		return respondJSON(res, { errors }, 400);
	}

	const search_term = '%' + (parse_result.output.search ?? '') + '%';
	const data = await orm.transaction(async (tx) => {
		const challenges = await tx
			.select()
			.from(table_challenges)
			.orderBy(table_challenges.id, table_challenges.name)
			.where(ilike(table_challenges.name, search_term))
			.limit(parse_result.output.limit)
			.offset(parse_result.output.offset);

		const [challenges_counter] = await tx
			.select({ count: count() })
			.from(table_challenges);
		return { challenges, count: challenges_counter?.count ?? 0 };
	});
	respondJSON(res, data);
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
	const parse_result = vb.safeParse(
		valibot_insert_challenge,
		req.body
	);
	if (!parse_result.success) {
		const { issues: errors } = parse_result;
		return respondJSON(res, { errors }, 400);
	}

	const { output: values } = parse_result;
	const challenge = await orm.insert(table_challenges).values(values).returning();
	respondJSON(res, { challenge }, 201);
}
export async function route_challenge_update(
	req: Request<{ id: string }>,
	res: Response<any, { challenge: SelectChallenge }>
): Promise<void> {
	const { challenge } = res.locals;

	const parse_result = vb.safeParse(
		valibot_update_challenge,
		req.body
	);
	if (!parse_result.success) {
		const { issues: errors } = parse_result;
		return respondJSON(res, { errors }, 400);
	}

	try {
		await orm.update(table_challenges).set(parse_result.output).where(eq(table_challenges.id, challenge.id));
		respondStatus(res, 200);
	} catch (error) {
		console.error(`Could not update challenge#${challenge.id}:`, error);
		respondStatus(res, 400);
	}
}
export async function route_challenge_delete(
	_req: Request<{ id: string }>,
	res: Response<any, { challenge: SelectChallenge }>
): Promise<void> {
	const { id } = res.locals.challenge;
	await orm.delete(table_challenges).where(eq(table_challenges.id, id));
	respondStatus(res, 200);
}
export async function route_challenge_inspect(
	_req: Request<{ id: string }>,
	res: Response<any, { challenge: SelectChallenge }>
): Promise<void> {
	const { challenge } = res.locals;
	respondJSON(res, { challenge }, 200);
}
