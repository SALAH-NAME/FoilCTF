import { type Request, type Response, type NextFunction } from 'express';

import { respondStatus } from './web.ts';
import {
	challenges as Challenges,
	challenges_attachments as ChallengesAttachments,
} from './orm/entities/init-models.ts';

// TODO(xenobas): Authorization middleware

export function middleware_error(
	err: Error,
	_req: Request,
	res: Response,
	_next: NextFunction
) {
	console.error(err);
	respondStatus(res, 500);
}
export function middleware_not_found(
	req: Request,
	res: Response,
	next: NextFunction
) {
	if (!req.route) {
		return respondStatus(res, 404);
	}
	next();
}
export function middleware_id_format(
	...param_keys: string[]
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
	const re = new RegExp(/^[1-9][0-9]*$/);
	return async function (req: Request, res: Response, next: NextFunction) {
		for (const key of param_keys) {
			const id = req.params[key];
			if (typeof id !== 'string' || !re.test(id)) {
				return respondStatus(res, 404);
			}
			next();
		}
	};
}
export async function middleware_challenge_exists(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const id = req.params['challenge_id'];

	const challenge = await Challenges.findByPk(Number(id));
	if (challenge === null) {
		return respondStatus(res, 404);
	}

	res.locals.challenge = challenge;
	next();
}
export async function middleware_attachment_exists(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const challenge_id = Number(req.params['challenge_id']);
	const attachment_id = Number(req.params['attachment_id']);

	const challenge_attachment = await ChallengesAttachments.findOne({
		where: { challenge_id, attachment_id },
	});
	if (challenge_attachment === null) {
		return respondStatus(res, 404);
	}

	res.locals.challenge_attachment = challenge_attachment;
	next();
}
export { json as middleware_json } from 'express';
