import { challenges as Challenges } from './orm/entities/init-models.ts';

import { type Request, type Response, type NextFunction } from 'express';
import { respondStatus } from './web.ts';

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
		respondStatus(res, 404);
		return;
	}
	next();
}
export async function middleware_id_format(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const { id } = req.params;
	if (typeof id !== 'string') {
		respondStatus(res, 404);
		return;
	}

	const re = new RegExp(/^[1-9][0-9]*$/);
	if (!re.test(id)) {
		respondStatus(res, 404);
		return;
	}

	next();
}
export async function middleware_id_exists(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const { id } = req.params;

	const challenge = await Challenges.findOne({ where: { id: Number(id) } });
	if (challenge === null) {
		respondStatus(res, 404);
		return;
	}

	res.locals.challenge = challenge;
	next();
}
export { json as middleware_json } from 'express';
