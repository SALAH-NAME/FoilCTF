import jwt, { VerifyErrors, VerifyCallback, JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User, AuthRequest } from './types';
import { AccessTokenSecret, AccessTokenExpiry } from './env';
import { ZodObject } from 'zod';

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

export function authenticateToken(
	req: AuthRequest,
	res: Response,
	next: NextFunction
) {
	const authHeader = req.get('authorization');
	if (!authHeader) {
		return res.sendStatus(400);
	}
	const [bearer, token] = authHeader.split(' ');
	if (bearer !== 'Bearer' || !token) {
		return res.sendStatus(401);
	}
	try {
		const decoded = jwt.verify(token, AccessTokenSecret) as User;
		res.locals.user = decoded;
		req.user = decoded; // multer expects the request not the ressponse (i.e. I can't use the res.locals)
		next();
	} catch (err) {
		return res.sendStatus(403);
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

export const getRandomNumber = (min: number, max: number) => {
	return Math.floor(Math.random() * (max - min + 1) + min);
};

export const isEmpty = (obj: Record<string, unknown>) => {
	if (obj == null || typeof obj !== 'object') {
		return false;
	}
	return Object.keys(obj).length === 0;
};
