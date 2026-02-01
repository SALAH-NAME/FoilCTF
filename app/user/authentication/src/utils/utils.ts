
import	jwt, {VerifyErrors, VerifyCallback, JwtPayload}	from 'jsonwebtoken';
import	{ Response, NextFunction }		from 'express';
import	{ User, AuthRequest}				from './types';
import	{ AccessTokenSecret, AccessTokenExpiry}		from './env';
import	{ ZodObject }					from 'zod';

export	function generateAccessToken(username: string, role: string) : string {
	return jwt.sign(	{ username: username, role: role },
				AccessTokenSecret,
				{ expiresIn: AccessTokenExpiry as any}
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

export	const	validate = (schema: ZodObject) =>
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
