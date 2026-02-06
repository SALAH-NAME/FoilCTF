
import	jwt, {VerifyErrors, VerifyCallback, JwtPayload}	from 'jsonwebtoken';
import	{ Response, NextFunction }			from 'express';
import	{ User, AuthRequest}			from './types';
import	{ AccessTokenSecret, AccessTokenExpiry}		from './env';
import	{ ZodObject }					from 'zod';

export	function generateAccessToken(username: string, role: string, id: number) : string {
	return jwt.sign(	{ username: username, role: role , id: id},
				AccessTokenSecret,
				{ expiresIn: AccessTokenExpiry as any}
			);
}

export	function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
	const	authHeader = req.get('authorization');
	if (authHeader === undefined) {
		return res.sendStatus(400);
	}
	const	[bearer, token]	= authHeader.split(' ');
	if (bearer !== 'Bearer' || !token) {
		return res.sendStatus(401);
	}
	try {
		const	decoded = jwt.verify(token, AccessTokenSecret) as User;
		req.user = decoded;
		next();
	} catch (err) {
		return res.sendStatus(403);
	}
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

export	const	getRandomNumber = (min: number, max: number) => {
	return (Math.floor(Math.random() * (max - min + 1) + min));
}
