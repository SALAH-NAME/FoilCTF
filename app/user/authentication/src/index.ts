
import	express, {Request, Response, NextFunction}	from 'express';
import	bcrypt						from 'bcrypt';
import	jwt, {VerifyErrors, VerifyCallback, JwtPayload}	from 'jsonwebtoken';
import	'dotenv/config';
import	{ drizzle }					from 'drizzle-orm/node-postgres';
import	{ serial }					from 'drizzle-orm/pg-core';
import	{ eq }						from 'drizzle-orm';
import	{ users }					from './db/schema';
import	{ db}						from './utils/db';
import	{ User, Post, AuthRequest}			from './utils/types';

import	{	AccessTokenSecret,
		RefreshTokenSecret,
		PORT,
		AccessTokenExpirationTime}		from './utils/env';

import	{	authenticateToken,
		generateAccessToken,
		validateUserInput,
		generateRandom,
		generateID}				from './utils/utils';

let	refreshTokens: string[] = [];


const	app = express();
app.use(express.json());

app.post('/api/auth/register', async (req: AuthRequest, res: Response) => {
	try {
		const	userInputStatus = await validateUserInput(req);
		if (userInputStatus) {
			res.sendStatus(userInputStatus);
			return ;
		}
		const	salt		= await bcrypt.genSalt();
		const	hashedPassword	= await bcrypt.hash(req.body.password, salt);
		const	user: User	= {
						id:		generateID(13), // TODO: must be generated in db! (and then remove this line)
						username:	req.body.username,
						email:		req.body.email,
						password:	hashedPassword
					  };
		await db.insert(users).values(user);
		console.log('New user created!');
		res.sendStatus(201);
	}
	catch (err) {
		console.error(err);
		res.sendStatus(500);
	}
});

app.post('/api/auth/login', async (req: AuthRequest, res: Response) => {
	if (req.body === undefined)
		res.sendStatus(400);
	const	username = req.body.username;
	const	password = req.body.password;
	if (username === undefined || password === undefined)
		res.sendStatus(400);
	const	[user] = await db.select().from(users).where(eq(users.username, username));
	if (user === undefined) {
		res.sendStatus(400);
		return ;
	}
	try {
		const	passwordIsValid = await bcrypt.compare(password, user.password);
		if (passwordIsValid) {
			const	accessToken	= generateAccessToken(user.username as any);
			const	refreshToken	= jwt.sign(user, RefreshTokenSecret);
			res.json({ accessToken: accessToken, refreshToken: refreshToken});
		}
		else {
			res.status(404).send();
			return ;
		}
	}
	catch (err) {
		console.error(err);
		res.sendStatus(500);
	}
})

app.post('/api/auth/refresh', (req: AuthRequest, res: Response) => {
	const	refreshToken = req.body.token;
	if (refreshToken === undefined) {
		res.sendStatus(401);
	}
	if (!refreshTokens.includes(refreshToken)) {
		res.sendStatus(403);
	}
	jwt.verify(refreshToken, RefreshTokenSecret,
		((err: VerifyErrors | null, payload?: JwtPayload | string | undefined) => {
		if (err) {
			res.sendStatus(403);
			return ;
		}
		req.user = payload as User;
		const	newAccessToken = generateAccessToken(req.user.username as any);
		res.json({ accessToken: newAccessToken });
	}) satisfies VerifyCallback)
})

app.delete('/api/auth/logout', (req: AuthRequest, res: Response) => {
	if (req.body.token === undefined) {
		res.status(400).send();
		return;
	}
	if (!refreshTokens.includes(req.body.token)) {
		res.status(400).send();
		return ;
	}
	refreshTokens = refreshTokens.filter(token => token !== req.body.token);
	res.sendStatus(204);
	return ;
})

app.listen(PORT, () => {
	console.log(`app listening on port ${PORT}`);
});
