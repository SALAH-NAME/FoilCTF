import { STATUS_CODES } from 'node:http';
import { type Response } from 'express';

export function respondJSON(
	res: Response,
	body: any,
	status_code: StatusCode = 200
) {
	res.header('Content-Type', 'application/json');
	res.status(status_code);
	res.send(JSON.stringify(body));
	res.end();
}

type StatusCode = keyof typeof STATUS_CODES & number;
export function respondStatus(res: Response, status_code: StatusCode = 200) {
	res.status(status_code);
	res.end();
}
