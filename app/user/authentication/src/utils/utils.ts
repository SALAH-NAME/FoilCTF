
import	jwt, {VerifyErrors, VerifyCallback, JwtPayload}	from 'jsonwebtoken';
import	express, { Request, Response, NextFunction }	from 'express';
import	{ User, AuthRequest}				from './types';
import	{ AccessTokenSecret, AccessTokenExpirationTime}	from './env';

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
