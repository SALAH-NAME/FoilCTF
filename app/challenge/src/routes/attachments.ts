import { type Request, type Response, type NextFunction } from 'express';

import {
	challenges as Challenges,
	attachments as Attachments,
	challenges_attachments as ChallengesAttachments,
} from '../orm/entities/init-models.ts';
import orm from '../orm/index.ts';
import * as vb from 'valibot';
import { respondJSON } from '../web.ts';
import { schema_attachment_create } from '../schemas.ts';

export async function route_attachment_create(
	req: Request,
	res: Response<{}, { challenge: Challenges }>,
	next: NextFunction
) {
	const { challenge } = res.locals;

	const parse_result = vb.safeParse(schema_attachment_create, req.body);
	if (!parse_result.success) {
		const { issues: errors } = parse_result;
		respondJSON(res, { errors }, 400);
		return;
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
	} catch (error) {
		await transaction.rollback();

		next(error);
		return;
	}
}
export async function route_attachments_list(
	_req: Request,
	res: Response,
	_next: NextFunction
) {
	// TODO(xenobas): Pagination might be needed ?
	const challenge = res.locals.challenge as Challenges;
	const attachments = await ChallengesAttachments.findAll({
		where: { challenge_id: challenge.id },
		include: [Attachments],
	});

	respondJSON(res, { attachments }, 200);
}
