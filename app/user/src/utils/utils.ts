import fs from 'node:fs';
import jwt from 'jsonwebtoken';
import { ZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

import { User, AuthRequest } from './types';
import {
	AccessTokenSecret,
	AccessTokenExpiry,
	RefreshTokenSecret,
	RefreshTokenExpiry,
} from './env';
import { db } from './db';
import { eq, or } from 'drizzle-orm';
import { users } from '../db/schema';
import bcrypt from 'bcrypt';
import { JWT_sign, JWT_verify } from '../jwt';

export function generateAccessToken(username: string, role: string, id: number): string {
	const payload = { username, role, id };
	return JWT_sign(payload, AccessTokenSecret, { expiresIn: AccessTokenExpiry });
}

export function generateRefreshToken(username: string, id: number): string {
	const payload = { username, id };
	return JWT_sign(payload, RefreshTokenSecret, { expiresIn: RefreshTokenExpiry });
}

export const parseNonExistingParam = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const username = req.params?.username as string | undefined;
	if (!username) return res.status(400).send();

	const [user] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.username, username));
	if (!user) return res.sendStatus(404);

	next();
};

export function authenticateToken(
	req: AuthRequest,
	res: Response,
	next: NextFunction
) {
	const header_value = req.get('authorization');
	const query_value = req.query.token;
	if (!header_value && !query_value) return res.sendStatus(400);

	let token = '';
	if (header_value) {
		if (!header_value.startsWith('Bearer ')) return res.sendStatus(401);
		token = header_value.slice('Bearer '.length);
	} else if (typeof query_value === 'string') {
		token = query_value;
	}

	const user = JWT_verify<User>(token, AccessTokenSecret);
	if (!user)
		return next(new Error('Unauthorized'));

	req.user = user;
	res.locals.user = user;
	next();
}

export function middleware_schema_validate(schema: ZodObject) {
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
	email?: string
): Promise<boolean>;
export async function user_exists(
	username: string | undefined,
	email: string
): Promise<boolean>;
export async function user_exists(
	username?: string,
	email?: string
): Promise<boolean> {
	if (!username) return false;
	if (!email) return false;

	const [existingUser] = await db
		.select()
		.from(users)
		.where(or(eq(users.username, username), eq(users.email, email)));
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
