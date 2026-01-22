import { ENV_API_PORT, ENV_API_HOST } from './env.ts';

import { challenges as Challenges } from './orm/entities/init-models.ts';
import { challengesCreationAttributes as ChallengesCreatePayload } from './orm/entities/init-models.ts';

import cors from 'cors';
import express, { json as middleware_json } from 'express';
import { type Request, type Response, type NextFunction } from 'express';

// TODO(xenobas): Authorization middleware

function middleware_error(
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction
) {
	console.error(err);
	res.sendStatus(500);
}
function middleware_cors() {
	// NOTE(xenobas): https://expressjs.com/en/resources/middleware/cors.html
	return cors({
		origin: 'http://localhost:5173',
	});
}

async function middleware_id_format(
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
async function middleware_id_exists(
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

export {
	middleware_cors,
	middleware_json,
	middleware_error,
	middleware_id_format,
	middleware_id_exists,
};
