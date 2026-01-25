
import	jwt, {VerifyErrors, VerifyCallback, JwtPayload}	from 'jsonwebtoken';
import	express, { Request, Response, NextFunction }	from 'express';
import	{ User, AuthRequest}				from './types';
import	{ AccessTokenSecret, AccessTokenExpirationTime}	from './env';
import	validator					from 'email-validator';
import	* as zod					from 'zod';
import	{ users, posts}					from './db';

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
	}) satisfies VerifyCallback) // to check
}

export	function	validateUserInput(req: AuthRequest): number {
	if (req.body === undefined)
		return (400);

	const	allValid = [req.body.username, req.body.email, req.body.password].every(input => input !== undefined);
	if (!allValid)
		return (400);

	const	usernameSchema = zod.string().min(4).max(15).regex(/^[a-zA-Z0-9_]/);
	try {
		usernameSchema.parse(req.body.username); // validate username
	} catch {
		return (400);
	}

	if (!validator.validate(req.body.email)) { // validate email
		return 400;
	}

	if (req.body.password.length < 12) { // enough??
		return 400;
	}
	if (users.find(user => user.email === req.body.email || user.username === req.body.username)) { // validate unicity
		return 409;
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
