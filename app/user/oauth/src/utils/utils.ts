
import	jwt, {type VerifyErrors, VerifyCallback, JwtPayload}	from 'jsonwebtoken';
import	{ Request, Response, NextFunction }			from 'express';
import	{ User }						from '../utils';
import	{ AccessTokenSecret }					from './env';

export	function generateAccessToken(name: string) : string {
	return jwt.sign({ name: name }, AccessTokenSecret, { expiresIn: '15min' });
}

export	function authenticateToken(req: Request, res: Response, next: NextFunction) : void {
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
