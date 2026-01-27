
import	express, {Request, Response, NextFunction}	from 'express';
import	bcrypt						from 'bcrypt';
import	jwt, {VerifyErrors, VerifyCallback, JwtPayload}	from 'jsonwebtoken';
import	{ AccessTokenSecret, RefreshTokenSecret, PORT}	from './utils/env';
import	{ AccessTokenExpirationTime}			from './utils/env';
import	{ User, Post, AuthRequest}			from './utils/types';
import	{ authenticateToken, generateAccessToken}	from './utils/utils';
import	{ validateUserInput}				from './utils/utils';
import	{ generateRandom, generateID}			from './utils/utils';
import	'dotenv/config';
import	{ drizzle }					from 'drizzle-orm/node-postgres';
import	{ serial }					from 'drizzle-orm/pg-core';
import	{ eq }						from 'drizzle-orm';
import	{ users }					from './db/schema';
import	{ db}						from './utils/db';

let	refreshTokens: string[] = [];


const	app = express();
app.use(express.json());

app.post('/api/auth/register', async (req: AuthRequest, res: Response) => {
	try {
		const	userInput = await validateUserInput(req);
		if (userInput) {
			res.sendStatus(userInput);
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
	catch {
		res.sendStatus(500);
	}
});

app.post('/api/auth/login', async (req: AuthRequest, res: Response) => {
	if (req.body === undefined)
		res.sendStatus(400);
	const	reqUsername = req.body.username;
	if (reqUsername === undefined)
		res.sendStatus(400);
	const	result = await db.select().from(users).where(eq(users.username, reqUsername));
	console.log('Getting user from the database: ', result);
	const	user = result[0]; // unicity!! is it enough to only check in registration??
	if (user == null) {
		res.sendStatus(400);
		return ;
	}
	try {
		if (await bcrypt.compare(req.body.password, user.password)) {
			const	accessToken	= generateAccessToken(user.username as any);
			const	refreshToken	= jwt.sign(user, RefreshTokenSecret);
			res.json({ accessToken: accessToken, refreshToken: refreshToken});
		}
		else {
			res.status(404).send();
			return ;
		}
	}
	catch {
		res.sendStatus(500);
		return ;
	}
})

app.post('/api/auth/refresh', (req: AuthRequest, res: Response) => {
	const	refreshToken = req.body.token;
	if (refreshToken == null) {
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
