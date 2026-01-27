
import	jwt, {VerifyErrors, VerifyCallback, JwtPayload}	from 'jsonwebtoken';
import	express, { Request, Response, NextFunction }	from 'express';
import	{ User, AuthRequest}				from './types';
import	{ AccessTokenSecret, AccessTokenExpirationTime}	from './env';
import	* as zod					from 'zod';
import	{ db}						from './db';
import	{ users}					from '../db/schema';
import	{ eq }						from 'drizzle-orm';

export	function generateAccessToken(username: string) : string {
	return jwt.sign({ username: username }, AccessTokenSecret, { expiresIn: AccessTokenExpirationTime as any});
}

export	function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) : void {
	const	authHeader = req.get('authorization');
	if (authHeader === undefined) {
		res.sendStatus(400); // bad request
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

export	async function	validateUserInput(req: AuthRequest): Promise<number> {
	if (req.body === undefined)
		return (400);

	const	username	= req.body.username;
	const	email		= req.body.email;
	const	password	= req.body.password;
	if (![username, email, password].every(info => info !== undefined))
		return (400);

	const	usernameSchema	= zod.string().min(4).max(15).regex(/^[a-zA-Z0-9_]+$/);
	const	emailSchema	= zod.email();
	const	passwordSchema	= zod.string().min(12);
	try {
		usernameSchema.parse(username);	// validate username
		emailSchema.parse(email);	// validate email
		passwordSchema.parse(password);	// validate password
	} catch {
		return (400);
	}
	const   [user] = await db.select().from(users).where(eq(users.username, username)); // validate unicity
        if (user !== undefined) {
                return (409);
        }
	return (0);
}


export	function	generateRandom(min: number, max: number) {
	return Math.floor(Math.random() * (max - min) + min);
}

export	function	generateID(length: number) {
	let result           = '';
	let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let charactersLength = characters.length;
	for (let i = 0; i < length; i++ ) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}
