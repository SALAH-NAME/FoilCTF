import * as vb from 'valibot';
import { type Request, type Response, type NextFunction } from 'express';

import orm, {
	challenges as Challenges,
	attachments as Attachments,
	challenges_attachments as ChallengesAttachments,
} from '../orm/index.ts';
import { respondJSON, respondStatus } from '../web.ts';
import { schema_attachment_create, schema_pagination } from '../schemas.ts';

export async function route_attachments_list(
	req: Request,
	res: Response<{}, { challenge: Challenges }>
) {
	const { challenge } = res.locals;

	const parse_result = vb.safeParse(schema_pagination, req.query);
	if (!parse_result.success) {
		const { issues: errors } = parse_result;
		return respondJSON(res, { errors }, 400);
	}

	const attachments = await ChallengesAttachments.findAll({
		where: { challenge_id: challenge.id },
		include: [Attachments],
		limit: parse_result.output.limit,
		offset: parse_result.output.offset,
	});
	return respondJSON(res, { attachments }, 200);
}
export async function route_attachment_create(
	req: Request,
	res: Response<{}, { challenge: Challenges }>
) {
	const { challenge } = res.locals;

	const parse_result = vb.safeParse(schema_attachment_create, req.body);
	if (!parse_result.success) {
		const { issues: errors } = parse_result;
		return respondJSON(res, { errors }, 400);
	}

	const { name, contents } = parse_result.output;
	const transaction = await orm.transaction();
	try {
		const attachment = await Attachments.create({ contents }, { transaction });
		const one_to_one = await ChallengesAttachments.create(
			{ challenge_id: challenge.id, attachment_id: attachment.id, name },
			{ transaction }
		);
		await transaction.commit();

		respondJSON(res, { challenge_attachment: one_to_one }, 201);
	} catch (err) {
		await transaction.rollback();
		throw err;
	}
}
export async function route_attachment_delete(
	_req: Request,
	res: Response<
		{},
		{ challenge: Challenges; challenge_attachment: ChallengesAttachments }
	>
) {
	const { challenge_attachment } = res.locals;
	await challenge_attachment.destroy();
	respondStatus(res, 204);
}
