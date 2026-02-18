import type { Request, Response } from 'express';

import { respondStatus } from '../web.ts';

export async function route_health(_req: Request, res: Response) {
	respondStatus(res, 200);
}
