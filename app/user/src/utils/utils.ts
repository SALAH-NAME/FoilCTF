import fs from 'node:fs';
import bcrypt from 'bcrypt';
import { eq, or } from 'drizzle-orm';
import { ZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

import {
	AccessTokenSecret,
	AccessTokenExpiry,
	RefreshTokenSecret,
	RefreshTokenExpiry,
} from './env';
import { db } from './db';
import { users } from '../db/schema';
import { User, AuthRequest } from './types';
import { JWT_Payload, JWT_sign, JWT_verify } from '../jwt';

export function generateAccessToken(
	username: string,
	role: string,
	id: number
): string {
	const payload = { username, role, id };
	return JWT_sign(payload, AccessTokenSecret, { expiresIn: AccessTokenExpiry });
}

export function generateRefreshToken(username: string, id: number): string {
	const payload = { username, id };
	return JWT_sign(payload, RefreshTokenSecret, {
		expiresIn: RefreshTokenExpiry,
	});
}

export const parseNonExistingParam = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const username = req.params?.username as string | undefined;
	if (!username)
		return res
			.status(400)
			.json({ error: 'Missing user pathname parameter' })
			.send();

	const [user] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.username, username));
	if (!user) return res.status(404).json({ error: "User doesn't exist" }).end();

	next();
};

export function authenticateToken(
	req: AuthRequest,
	res: Response,
	next: NextFunction
) {
	const header_value = req.get('authorization');
	const query_value = req.query.token;
	if (!header_value && !query_value)
		return res.status(401).json({ error: 'Unauthorized' }).end();

	let token = '';
	if (header_value) {
		if (!header_value.startsWith('Bearer '))
			return res
				.status(401)
				.json({ error: 'Authorization protocol is invalid' })
				.end();
		token = header_value.slice('Bearer '.length);
	} else if (typeof query_value === 'string') {
		token = query_value;
	}

	const user = JWT_verify<User>(token, AccessTokenSecret);
	if (!user)
		return res.status(401).json({ error: 'Invalid access token' }).end();

	req.user = user;
	res.locals.user = user;

	next();
}

export function extractor_request_token(req: Request): string | null {
	const token_query = req.query['token'];
	if (typeof token_query === 'string' && token_query) return token_query;

	const value_header = req.get('Authorization');
	if (typeof value_header !== 'string' || !value_header.startsWith('Bearer '))
		return null;

	return value_header.slice('Bearer '.length) || null;
};

export function middleware_auth_optional(req: Request, res: Response, next: NextFunction) {
	const token = extractor_request_token(req);
	if (!token)
		return next();
	res.locals.user = JWT_verify<JWT_Payload>(token, AccessTokenSecret);
	return next();
}

export function middleware_schema_validate<T extends ZodObject>(schema: T) {
	return async (req: Request, _res: Response, next: NextFunction) => {
		const { body } = schema.parse({ body: req.body });
		req.body = body;

		next();
	};
}

export const isEmpty = (obj: unknown) => {
	if (obj == null || typeof obj !== 'object') {
		return false;
	}
	return Object.keys(obj).length === 0;
};

export async function password_validate(
	password: string,
	username: string
): Promise<boolean> {
	const PASSWORD_DUMMY = '$2b$10$dummyhashplaceholder';

	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.username, username));

	const is_valid = await bcrypt.compare(
		password,
		user?.password ?? PASSWORD_DUMMY
	);
	return is_valid;
}

export async function user_exists(
	username: string,
	email: string
): Promise<boolean> {
	const [existingUser] = await db
		.select()
		.from(users)
		.where(or(eq(users.username, username), eq(users.email, email)));
	return Boolean(existingUser);
}

export async function user_exists_username(username: string) {
	const [existingUser] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.username, username));
	return Boolean(existingUser);
}
export async function user_exists_email(email: string) {
	const [existingUser] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, email));
	return Boolean(existingUser);
}

export function folder_exists(folder_path: string): boolean {
	const stats = fs.statSync(folder_path, { throwIfNoEntry: false });

	if (!stats) return false;
	if (!stats.isDirectory()) return false;

	try {
		fs.accessSync(folder_path, fs.constants.R_OK | fs.constants.W_OK);
		return true;
	} catch {
		return false;
	}
}

// TODO(xenobas): Metrics
export function middleware_logger(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const time_start = Date.now();
	const DateTimeFormatter = new Intl.DateTimeFormat(); // NOTE(xenobas): Useless instantiation on each request!
	res.on('finish', () => {
		const time_end = Date.now();
		const latency = time_end - time_start;

		const datetime = DateTimeFormatter.format(new Date(time_end));
		console.log(
			'%s - %s - %s - %d - %dms',
			datetime,
			req.path,
			req.method,
			res.statusCode,
			latency
		);
	});

	next();
}
