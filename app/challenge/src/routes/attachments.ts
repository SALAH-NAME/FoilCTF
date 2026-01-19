import { type Request, type Response } from 'express';

import {
	challenges as Challenges,
} from '../orm/entities/init-models.ts';

export async function route_attachment_create(req: Request, res: Response) {
	res.sendStatus(501);
	res.end();
}
