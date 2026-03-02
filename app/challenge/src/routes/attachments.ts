import * as vb from 'valibot';
import { and, eq } from 'drizzle-orm';
import { type Request, type Response } from 'express';

import orm, {
	attachments as table_attachments,
	challenges_attachments as table_challenges_attachments,
} from '../orm/index.js';
import { SelectChallenge } from './challenges.js';
import { respondJSON, respondStatus } from '../web.js';
import { schema_attachment_create, schema_pagination } from '../schemas.js';
import { createSelectSchema, createUpdateSchema } from 'drizzle-valibot';

export const valibot_select_challenges_attachments = createSelectSchema(table_challenges_attachments);
export const valibot_update_challenges_attachments = createUpdateSchema(table_challenges_attachments);

export type SelectChallengesAttachments = vb.InferOutput<typeof valibot_select_challenges_attachments>;

export async function route_attachments_list(
	req: Request,
	res: Response<{}, { challenge: SelectChallenge }>
) {
	const { challenge } = res.locals;

	const parse_result = vb.safeParse(schema_pagination, req.query);
	if (!parse_result.success)
		return respondJSON(res, { error: 'Pagination could not be parsed' }, 400);

	const attachments = await orm
		.select({
			challenge_id: table_challenges_attachments.challenge_id,
			attachment_id: table_challenges_attachments.attachment_id,
			name: table_challenges_attachments.name,
			contents: table_attachments.contents,
		})
		.from(table_challenges_attachments)
		.leftJoin(table_attachments, eq(table_challenges_attachments.attachment_id, table_attachments.id))
		.where(eq(table_challenges_attachments.challenge_id, challenge.id));
	return respondJSON(res, { attachments }, 200);
}
export async function route_attachment_create(
	req: Request,
	res: Response<{}, { challenge: SelectChallenge }>
) {
	const { challenge } = res.locals;

	const parse_result = vb.safeParse(schema_attachment_create, req.body);
	if (!parse_result.success) {
		const { issues: errors } = parse_result;
		return respondJSON(res, { errors }, 400);
	}

	const { name, contents } = parse_result.output;
	const challenge_attachment = await orm.transaction(async (tx) => {
		const [attachment] = await tx
			.insert(table_attachments)
			.values({ contents })
			.returning();
		if (!attachment)
			throw new Error('Attachment doesn\'t exist');

		const [challenge_attachment] = await tx
			.insert(table_challenges_attachments)
			.values({ name, challenge_id: challenge.id, attachment_id: attachment.id })
			.returning();
		return challenge_attachment;
	});
	respondJSON(res, { challenge_attachment }, 201);
}
export async function route_attachment_delete(
	_req: Request,
	res: Response<
		any,
		{ challenge: SelectChallenge; challenge_attachment: SelectChallengesAttachments }
	>
) {
	const { challenge_attachment } = res.locals;
	await orm
		.delete(table_challenges_attachments)
		.where(
			and(
				eq(table_challenges_attachments.attachment_id, challenge_attachment.attachment_id),
				eq(table_challenges_attachments.challenge_id, challenge_attachment.challenge_id),
			)
		);
	respondStatus(res, 204);
}
