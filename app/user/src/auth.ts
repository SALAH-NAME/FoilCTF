import zod from 'zod';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import ms, { StringValue } from 'ms';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { type Request, type Response } from 'express';

import { db } from './utils/db';
import { loginSchema, registerSchema } from './utils/types';
import { RefreshTokenSecret, RefreshTokenExpiry } from './utils/env';
import { users, sessions as table_sessions, profiles } from './db/schema';
import {
	generateAccessToken,
	generateRefreshToken,
	user_exists,
} from './utils/utils';
import { JWT_verify } from './jwt';

export const route_auth_register = async (
	req: Request<any, any, zod.infer<typeof registerSchema>['body']>,
	res: Response
) => {
	try {
		const { username, email, password } = req.body; // already validated by zod
		const existingUser = await user_exists(username, email);
		if (existingUser) {
			return res.sendStatus(409);
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		await db.insert(users).values({
			username: username,
			email: email,
			password: hashedPassword,
		});
		await db.insert(profiles).values({
			// user profile creation on registry
			username: username,
			challengessolved: 0,
			eventsparticipated: 0,
			totalpoints: 0,
		});
		console.log(`New user created: ${username}`);
		res.sendStatus(201);
	} catch (err) {
		console.error(err);
		res.sendStatus(500);
	}
};

export const route_auth_login = async (
	req: Request<any, any, zod.infer<typeof loginSchema>['body']>,
	res: Response
) => {
	const { username, password } = req.body;
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.username, username));

	const password_value = user?.password ?? '$2b$10$dummyhashplaceholder';
	const passwords_match = await bcrypt.compare(password, password_value);
	if (!user || !passwords_match)
		return res
			.status(401)
			.json({ error: 'Incorrect username and/or password' })
			.end();

	const token_access = generateAccessToken(user.username, user.role, user.id);
	const token_refresh = generateRefreshToken(user.username, user.id);
	const expiry_date = new Date(
		Date.now() + ms(RefreshTokenExpiry as StringValue)
	);
	await db.insert(table_sessions).values({
		refreshtoken: token_refresh,
		expiry: expiry_date.toISOString(),
		userId: user.id,
	});

	return res
		.status(200)
		.json({ token_access, token_refresh, expiry: expiry_date.toISOString() })
		.end();
};

export const route_auth_refresh = async (req: Request, res: Response) => {
	const token = req.query['token'];
	if (typeof token !== 'string')
		return res.status(400).json({ error: 'Missing required query parameter `token`' }).end();
	if (!JWT_verify(token, RefreshTokenSecret))
		return res.status(401).json({ error: 'Could not verify token' }).end();

	const [session] = await db
		.select()
		.from(table_sessions)
		.where(eq(table_sessions.refreshtoken, token)); // delete the expired ones? or even limit number of devices connected to at a time
	if (!session)
		return res.sendStatus(403);

	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, session.userId));
	if (!user)
		return res.sendStatus(400);

	const token_access = generateAccessToken(user.username, user.role, user.id);
	res.json({ token_access });
};

export const route_auth_logout = async (req: Request, res: Response) => {
	// DANGER(xenobas): This implies that if any one gets access to your refresh token they can log you out remotely.
	const token_refresh = req.query['token'];
	if (typeof token_refresh !== 'string' || !token_refresh) {
		return res.sendStatus(400);
	}

	const cond = eq(table_sessions.refreshtoken, token_refresh);
	await db.delete(table_sessions).where(cond);

	return res.sendStatus(204);
};
