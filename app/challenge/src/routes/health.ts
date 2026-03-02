import type { Request, Response } from 'express';

import { respondStatus } from '../web.js';

export async function route_health(_req: Request, res: Response) {
	respondStatus(res, 200);
}
