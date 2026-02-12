import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User, AuthRequest } from './types';
import {
	AccessTokenSecret,
	AccessTokenExpiry,
	RefreshTokenSecret,
	RefreshTokenExpiry,
} from './env';
import { ZodObject } from 'zod';
import { db } from './db';
import { eq, or } from 'drizzle-orm';
import { users } from '../db/schema';
import bcrypt from 'bcrypt';

export function generateAccessToken(
	username: string,
	role: string,
	id: number
): string {
	return jwt.sign(
		{ username: username, role: role, id: id },
		AccessTokenSecret,
		{ expiresIn: AccessTokenExpiry as any }
	);
}

export function generateRefreshToken(username: string, id: number): string {
	return jwt.sign({ username: username, id: id }, RefreshTokenSecret, {
		expiresIn: RefreshTokenExpiry as any,
	});
}

export const parseNonExistingParam = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const username = req.params?.username as string;
	if (!username) {
		return res.status(400).send();
	}
	const [existingUser] = await db
		.select()
		.from(users)
		.where(eq(users.username, username));
	if (!existingUser) {
		return res.sendStatus(404);
	}
	next();
};

export function authenticateToken(
	req: AuthRequest,
	res: Response,
	next: NextFunction
) {
	const authHeader = req.get('authorization');
	if (!authHeader) {
		return res.sendStatus(401);
	}
	const [bearer, ...tokens] = authHeader.split(' ');
	if (bearer !== 'Bearer' || tokens.length != 1) {
		return res.sendStatus(401);
	}
	try {
		const decoded = jwt.verify(tokens[0] ?? ' ', AccessTokenSecret) as User;
		res.locals.user = decoded;
		req.user = decoded; // multer expects the request not the ressponse (meaning I can't use the res.locals)
		next();
	} catch (err) {
		return res.sendStatus(401);
	}
}

export const validate =
	(schema: ZodObject) =>
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const parsed = schema.parse({
				body: req.body,
			});
			req.body = parsed.body;
			return next();
		} catch (error) {
			// shcema not validated
			next(error);
		}
	};

export const isEmpty = (obj: Record<string, unknown>) => {
	if (obj == null || typeof obj !== 'object') {
		return false;
	}
	return Object.keys(obj).length === 0;
};

export const validatePassword = async (
	passwordToValidate: string,
	username: string
) => {
	if (passwordToValidate === undefined) return false;
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.username, username));
	const passwordIsValid = await bcrypt.compare(
		passwordToValidate,
		user?.password ?? '$2b$10$dummyhashplaceholder'
	);
	if (passwordIsValid === true) return true;
	return false;
};

export const existingUserFunction = async (username: string, email: string) => {
	if (username === undefined && email === undefined) return false;
	const [existingUser] = await db
		.select()
		.from(users)
		.where(or(eq(users.username, username), eq(users.email, email)));
	if (existingUser) {
		return true;
	}
	return false;
};
