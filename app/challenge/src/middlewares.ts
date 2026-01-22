import { ENV_API_PORT, ENV_API_HOST } from './env.ts';

import { challenges as Challenges } from './orm/entities/init-models.ts';
import { challengesCreationAttributes as ChallengesCreatePayload } from './orm/entities/init-models.ts';

import express, { json as middleware_json } from 'express';
import { type Request, type Response, type NextFunction } from 'express';

// TODO(xenobas): Authorization middleware

export function middleware_error(
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction
) {
	console.error(err);
	res.sendStatus(500);
}
export async function middleware_id_format(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const { id } = req.params;
	if (typeof id !== 'string') {
		res.sendStatus(400);
		return;
	}

	const re = new RegExp(/^[1-9][0-9]*$/);
	if (!re.test(id)) {
		res.sendStatus(404);
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
		res.sendStatus(404);
		res.end();

		return;
	}

	res.locals.challenge = challenge;
	next();
}

export { middleware_json };
