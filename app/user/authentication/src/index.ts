
import	'dotenv/config';
import	express, {Request, Response, NextFunction}	from 'express';
import	bcrypt						from 'bcrypt';
import	jwt, {VerifyErrors, VerifyCallback, JwtPayload}	from 'jsonwebtoken';
import	{ drizzle }					from 'drizzle-orm/node-postgres';
import	{ serial }					from 'drizzle-orm/pg-core';
import	{ eq }						from 'drizzle-orm';
import	{ users, sessions }				from './db/schema';
import	{ db}						from './utils/db';
import	{ RefreshTokenSecret, PORT}			from './utils/env';
import	{ ZodError}					from 'zod';
import	cookieParser					from 'cookie-parser';
import	{ User,
	AuthRequest,
	Session,
	logout_refresh_Schema,
	registerSchema,
	loginSchema}					from './utils/types';

import	{	authenticateToken,
		generateAccessToken,
		generateID,
		validate}				from './utils/utils';


const	app = express();
app.use(express.json());
app.use(cookieParser());

app.post('/api/auth/register',
	validate(registerSchema),
	async (req: AuthRequest, res: Response) => {
	try {
		const	{username, email, password} = req.body;
		const   [unique] = await db.select().from(users).where(eq(users.username, username));
		if (unique) {
			res.sendStatus(409);
		}
		const	salt		= await bcrypt.genSalt();
		const	hashedPassword	= await bcrypt.hash(password, salt);
		const	user: User	= {
						id:		generateID(13), // TODO: must be generated in db! (and then remove this line)
						username:	username,
						email:		email,
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

app.post('/api/auth/login',
	validate(loginSchema),
	async (req: AuthRequest, res: Response) => {
		const	{username, password} = req.body;
		const	[user] = await db.select().from(users).where(eq(users.username, username));
		if (user === undefined) {
			res.sendStatus(400);
			return ;
		}
		try {
			const	passwordIsValid = await bcrypt.compare(password, user.password);
			if (passwordIsValid) {
				const	accessToken		= generateAccessToken(user.username as any, "user");
				const	refreshToken		= jwt.sign({username: user.username}, RefreshTokenSecret, { expiresIn: '7d' });
				const	session: Session	= {
						refreshtoken:	refreshToken,
						expiry:		"2026-12-31", // demo !!
						userId:		user.id,
						}
				await db.insert(sessions).values(session);
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

app.post('/api/auth/refresh', // update this function
	validate(logout_refresh_Schema),
	async (req: AuthRequest, res: Response) => {
	const	{ token } = req.cookies.jwt;

	const	[session] = await db.select().from(sessions).where(eq(sessions.refreshtoken, token));
	if (session === undefined) {
		res.sendStatus(403);
		return ;
	}
	const	[user] = await db.select().from(users).where(eq(users.id, session.userId));
	if (user === undefined) {
		res.status(400).send('You\'re trynna do something fancy');
		return ;
	}
	const	newAccessToken = generateAccessToken(user.username as string, "user");
	jwt.verify(token, RefreshTokenSecret,
		((err: VerifyErrors | null, payload?: JwtPayload | string | undefined) => {
		if (err) {
			res.sendStatus(403);
			return ;
		}
		req.user = payload as User;
		res.json({ accessToken: newAccessToken });
	}) satisfies VerifyCallback);
})

app.delete('/api/auth/logout',
	validate(logout_refresh_Schema),
	async (req: AuthRequest, res: Response) => {
	const	{ token } = req.cookies.jwt;

	const	[session] = await db.select().from(sessions).where(eq(sessions.refreshtoken, token));
	if (session === undefined) {
		res.status(403).send();
		return ;
	}
	await db.delete(sessions).where(eq(sessions.refreshtoken, token));
	console.log('user session got deleted');
	res.clearCookie('jwt');
	res.sendStatus(204);
	return ;
})

app.use((err: any, req: AuthRequest, res: Response, next: NextFunction) => {
	if (err instanceof ZodError) {
		return res.sendStatus(400);
	}
	console.error(err);
	res.sendStatus(500);
})

app.listen(PORT, () => {
	console.log(`app listening on port ${PORT}`);
});
