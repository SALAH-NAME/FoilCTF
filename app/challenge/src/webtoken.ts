import jwt from 'jsonwebtoken';
import { ENV_ACCESS_TOKEN_SECRET } from './env.js';

export type WebTokenRole = 'admin' | 'user';
export interface WebToken {
	id: number;
	role: WebTokenRole;
	username: string;
}

export function JWT_verify(token: string) {
	try {
		const payload = jwt.verify(token, ENV_ACCESS_TOKEN_SECRET);
		if (typeof payload === 'string')
			return (null);
		return (payload as WebToken);
	} catch (err) {
		return (null);
	}
}
