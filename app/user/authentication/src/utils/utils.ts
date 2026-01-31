
import	jwt, {VerifyErrors, VerifyCallback, JwtPayload}	from 'jsonwebtoken';
import	express, { Response, NextFunction }		from 'express';
import	{ User, AuthRequest}				from './types';
import	{ AccessTokenSecret, AccessTokenExpirationTime}	from './env';
import	{ z, Schema}					from 'zod';
import	{ db}						from './db';
import	{ users}					from '../db/schema';
import	{ eq }						from 'drizzle-orm';

export	function generateAccessToken(username: string, role: string) : string {
	return jwt.sign(	{ username: username, role: role },
				AccessTokenSecret,
				{ expiresIn: AccessTokenExpirationTime as any}
			);
}

export	function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) : void {
	const	authHeader = req.get('authorization');
	if (authHeader === undefined) {
		res.sendStatus(400);
		return ;
	}
	const	[bearer, token]	= authHeader.split(' ');
	if (bearer !== 'Basic' || token === undefined) {
		res.sendStatus(401);
		return ;
	}

	jwt.verify(token, AccessTokenSecret, ((err: VerifyErrors | null, payload?: JwtPayload | string | undefined) => {
		if (err) {
			res.sendStatus(403);
			return ;
		}
		req.user = payload as User; // LGHALB ALLAH
		next();
	}) satisfies VerifyCallback)
}


export	function	generateRandom(min: number, max: number) {
	return Math.floor(Math.random() * (max - min) + min);
}

export	function	generateID(length: number) {
	let	result           = '';
	let	characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let	charactersLength = characters.length;
	for (let i = 0; i < length; i++ ) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

export	const	validate = (schema: Schema) =>
	async (req: AuthRequest, res: Response, next: NextFunction) =>
	{
		try {
			await schema.parseAsync({
				body:		req.body,
				query:		req.query,
				params:		req.params,
				cookies:	req.cookies
				});
			return next();
		}
		catch (error) {
			next(error);
		}
	}
