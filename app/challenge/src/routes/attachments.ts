import { type Request, type Response, type NextFunction } from 'express';
import {
	check_object,
	check_string,
	type ParseErrors,
	type ParseResult,
} from '../parse.ts';

import {
	challenges as Challenges,
	attachments as Attachments,
	challenges_attachments as ChallengesAttachments,
} from '../orm/entities/init-models.ts';
import orm from '../orm/index.ts';
import { respondJSON } from '../web.ts';

type PayloadAttachmentCreate = { name: string; contents: Record<string, any> };
function parse_attachement_create(
	body: Record<string, any> | undefined
): ParseResult<PayloadAttachmentCreate> {
	const errors: ParseErrors<PayloadAttachmentCreate> = {};
	if (body === undefined) {
		errors['body'] = 'Must not be empty';
		return { ok: false, errors };
	}

	errors['name'] = check_string(body['name'], { min_length: 4 });
	errors['contents'] = check_object(body['contents']);

	const errors_count = Object.values(errors).filter(
		(x) => typeof x === 'string'
	).length;
	if (errors_count > 0) return { ok: false, errors };

	const name = body['name'] as string;
	const contents = body['contents'] as Record<string, any>;
	return {
		ok: true,
		payload: { name, contents },
	};
}
export async function route_attachment_create(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const challenge = res.locals.challenge as Challenges;

	const parse_result = parse_attachement_create(req.body);
	if (parse_result.ok === false) {
		const { errors } = parse_result;
		respondJSON(res, { errors }, 400);

		return;
	}

	const { name, contents } = parse_result.payload;
	const transaction = await orm.transaction();
	try {
		const attachment = await Attachments.create({ contents }, { transaction });
		const chall_attach = await ChallengesAttachments.create(
			{ challenge_id: challenge.id, attachment_id: attachment.id, name },
			{ transaction }
		);

		await transaction.commit();

		respondJSON(res, { challenge_attachment: chall_attach }, 201);
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
