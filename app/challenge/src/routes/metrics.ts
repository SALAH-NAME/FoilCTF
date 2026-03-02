import type { Request, Response } from 'express';

import { register } from '../prometheus.js';

export async function route_metrics(_req: Request, res: Response) {
	const metrics = await register.metrics();

	res.header('Content-Type', register.contentType);
	res.send(metrics);
}
