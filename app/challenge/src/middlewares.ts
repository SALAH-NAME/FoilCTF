import cors from 'cors';
import { and, eq } from 'drizzle-orm';
import type { Request, Response, NextFunction } from 'express';

import { respondJSON } from './web.js';
import { metric_lats, metric_reqs } from './prometheus.js';

import orm, {
	challenges as table_challenges,
	challenges_attachments as table_challenges_attachments,
} from './orm/index.js';

// TODO(xenobas): Authorization middleware

const DateTimeFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'short' });

export const middleware_cors = cors({
	origin: '*',
});
export function middleware_error(
	err: any,
	_req: Request,
	res: Response,
	_next: NextFunction
) {
	if (!(err instanceof SyntaxError))
		console.error(err);
	respondJSON(res, { err: err.message ?? "Internal Server Error" }, err.statusCode ?? 500);
}
export function middleware_not_found(
	req: Request,
	res: Response,
	next: NextFunction
) {
	if (!req.route)
		return respondJSON(res, { error: 'Not found' }, 404);
	next();
}
export function middleware_id_format(
	...param_keys: string[]
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
	const re = new RegExp(/^[1-9][0-9]*$/);
	return async function (req: Request, res: Response, next: NextFunction) {
		for (const key of param_keys) {
			const id = req.params[key];
			if (typeof id !== 'string' || !re.test(id))
				return respondJSON(res, { error: `Parameter "${key}" is invalid` }, 400);
		}
		next();
	};
}
export function middleware_metric_reqs(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const lat_end = metric_lats.startTimer();
	res.on('finish', () => {
		lat_end();
		metric_reqs.inc({ status_code: res.statusCode });

		const datetime = DateTimeFormatter.format(new Date());
		console.log('%s - %s - %s - %d', datetime, req.path, req.method, res.statusCode);
	});

	next();
}
export async function middleware_challenge_exists(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const id = Number(req.params.challenge_id);
	if (!isFinite(id))
		return respondJSON(res, { error: "Challenge identifier is invalid" }, 400);

	const [challenge] = await orm.select().from(table_challenges).where(eq(table_challenges.id, id));
	if (!challenge)
		return respondJSON(res, { error: "Challenge doesn't exist" }, 404);

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
	if (!isFinite(challenge_id) || !isFinite(attachment_id))
		return respondJSON(res, { error: "Invalid challenge attachment identifiers" }, 400);

	const [challenge_attachment] = await orm
		.select()
		.from(table_challenges_attachments)
		.where(and(eq(table_challenges_attachments.challenge_id, challenge_id), eq(table_challenges_attachments.attachment_id, attachment_id)));
	if (!challenge_attachment)
		return respondJSON(res, { error: "Challenge attachment does not exist" }, 404);

	res.locals.challenge_attachment = challenge_attachment;
	next();
}
export { json as middleware_json } from 'express';
