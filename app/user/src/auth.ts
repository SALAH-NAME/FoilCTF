import zod from 'zod';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import ms, { StringValue } from 'ms';
import jwt, { JsonWebTokenError, type JwtPayload } from 'jsonwebtoken';
import { type Request, type Response } from 'express';

import { db } from './utils/db';
import { users, sessions, profiles } from './db/schema';
import { RefreshTokenSecret, RefreshTokenExpiry } from './utils/env';
import {
	generateAccessToken,
	generateRefreshToken,
	user_exists,
} from './utils/utils';
import { FoilCTF_Error, FoilCTF_Success, loginSchema, registerSchema } from './utils/types';

export const route_auth_register = async (
	req: Request<any, any, zod.infer<typeof registerSchema>['body']>,
	res: Response
) => {
	try {
		const { username, email, password } = req.body; // already validated by zod
		const existingUser = await user_exists(username, email);
		if (existingUser) {
			return res.status(409).json(new FoilCTF_Error("Conflict", 409));
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
		return res.status(201).json(new FoilCTF_Success("Created", 201));
	} catch (err) {
		console.error(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
};

export const route_auth_login = async (
	req: Request<any, any, zod.infer<typeof loginSchema>['body']>,
	res: Response
) => {
	const { username, password } = req.body;
	try {
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.username, username));
		const passwordIsValid = await bcrypt.compare(
			password,
			user?.password ?? '$2b$10$dummyhashplaceholder'
		);
		if (user === undefined || !passwordIsValid) {
			return res.status(401).json(new FoilCTF_Error("Invalid username or password", 401));
		}

		const accessToken = generateAccessToken(
			user.username as any,
			user.role,
			user.id
		);
		const refreshToken = generateRefreshToken(user.username as any, user.id);
		const duration = ms(RefreshTokenExpiry as StringValue);
		const expiryDate = new Date(Date.now() + duration);
		await db.insert(sessions).values({
			refreshtoken: refreshToken,
			expiry: expiryDate.toISOString(),
			userId: user.id,
		});
		res.cookie('jwt', refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: duration,
		});
		return res.status(200).json({ accessToken: accessToken, refreshToken: refreshToken });
	} catch (err) {
		console.error(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
};

export const route_auth_refresh = async (req: Request, res: Response) => {
	try {
		const token = req.cookies?.jwt ?? ''; // cookie for refresh token
		jwt.verify(token, RefreshTokenSecret) as JwtPayload;

		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.refreshtoken, token)); // delete the expired ones? or even limit number of devices connected to at a time
		if (session === undefined) {
			return res.status(403).json(new FoilCTF_Error("Forbidden", 403));
		}

		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.id, session.userId));
		if (user === undefined) {
			return res.status(400).json(new FoilCTF_Error("Bad Request", 400));
		}
		const newAccessToken = generateAccessToken(
			user.username as string,
			user.role,
			user.id
		);
		return res.status(200).json({ accessToken: newAccessToken });
	} catch (err) {
		if (err instanceof JsonWebTokenError)
			return res.status(401).json(new FoilCTF_Error("Unauthorized", 401));
		console.error(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
};

export const route_auth_logout = async (req: Request, res: Response) => {
	try {
		const token = req.cookies?.jwt; // cookie for refresh token
		if (token) {
			await db.delete(sessions).where(eq(sessions.refreshtoken, token));
			console.log('user session got deleted');
		}

		res.clearCookie('jwt', {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
		});
		return res.status(204).json(new FoilCTF_Success("No Content", 204));
	} catch (err) {
		console.error(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
};
