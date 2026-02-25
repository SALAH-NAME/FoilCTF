import { register } from '../prometheus';
import type { Request, Response } from 'express';

export async function route_metrics(_req: Request, res: Response) {
    const metrics = await register.metrics();

    res.header('Content-Type', register.contentType);
    res.send(metrics);
}
