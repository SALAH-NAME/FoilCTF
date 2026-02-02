
import	'dotenv/config';
import	express, {Response, NextFunction}	from 'express';
import	bcrypt						from 'bcrypt';
import	jwt, {JwtPayload}	from 'jsonwebtoken';
import	{ eq, or}						from 'drizzle-orm';
import	{ users, sessions }				from './db/schema';
import	{ db}						from './utils/db';
import	ms, {StringValue}				from 'ms';
import	{	RefreshTokenSecret,
		PORT,
		RefreshTokenExpiry
	}						from './utils/env';
import	{ ZodError}					from 'zod';
import	cookieParser					from 'cookie-parser';
import	{	User,
		AuthRequest,
		registerSchema,
		loginSchema
		}					from './utils/types';

import	{
		generateAccessToken,
		validate}				from './utils/utils';


const	app = express();
app.use(express.json());
app.use(cookieParser());

app.post('/api/auth/register',
	validate(registerSchema),
	async (req: AuthRequest, res: Response) => {
	try {
		let	{username, email, password} = req.body;
		email		= email.toLowerCase();
		const   [existingUser] = await db.select()
						.from(users)
						.where(or(eq(users.username, username), eq(users.email, email)));
		if (existingUser) {
			res.sendStatus(409);
			return ;
		}
		const	hashedPassword	= await bcrypt.hash(password, 10);
		const	newUser: User	= {
						username:	username,
						email:		email,
						password:	hashedPassword
					  };
		await db.insert(users).values(newUser);
		console.log(`New user created: ${username}`);
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
		let	{username, password} = req.body;
		try {
			const	[user] = await db.select().from(users).where(eq(users.username, username));
			const	passwordIsValid = await bcrypt.compare(password,
							user?.password ?? "$2b$10$dummyhashplaceholder");
			if (user === undefined || !passwordIsValid) {
				res.status(401).send('Invalid username or password');
				return ;
			}

			const	accessToken		= generateAccessToken(user.username as any, user.role);
			const	refreshToken		= jwt.sign(	{username: user.username},
													RefreshTokenSecret,
													{ expiresIn: RefreshTokenExpiry as any}
								);
			const	duration	= ms(RefreshTokenExpiry as StringValue);
			const	expiryDate	= new Date(Date.now() + duration);
			await db.insert(sessions).values({
					refreshtoken:	refreshToken,
					expiry:		expiryDate.toISOString(),
					userId:		user.id,
				});
			res.cookie('jwt', refreshToken, {
				httpOnly:	true,
				secure:		true,
				sameSite:	'strict',
				maxAge:		duration
			});
			res.json({ accessToken: accessToken, refreshToken: refreshToken});
		}
		catch (err) {
			console.error(err);
			res.sendStatus(500);
		}
})

app.post('/api/auth/refresh',
	async (req: AuthRequest, res: Response) => {
		try {
			const	token = req.cookies?.jwt ?? "";
			jwt.verify(token, RefreshTokenSecret) as JwtPayload; // promisify??

			const	[session] = await db.select()
					.from(sessions).
					where(eq(sessions.refreshtoken, token));
			if (session === undefined) {
				res.sendStatus(403);
				return ;
			}
			const	[user] = await db.select()
					.from(users)
					.where(eq(users.id, session.userId));
			if (user === undefined) {
				res.status(400).send();
				return ;
			}
			const	newAccessToken = generateAccessToken(user.username as string, user.role);
			res.json({ accessToken: newAccessToken });
		} catch (err) {
			return res.sendStatus(403);
		}
	}
)

app.delete('/api/auth/logout',
	async (req: AuthRequest, res: Response) => {
		try {
			const	token = req.cookies?.jwt;
			if (token) {
				await db.delete(sessions).where(eq(sessions.refreshtoken, token));
				console.log('user session got deleted');
			}

			res.clearCookie('jwt', {
				httpOnly:	true,
				secure:		true,
				sameSite:	'strict'
			});
			return res.sendStatus(204);
		} catch (err) {
			console.error(err);
			return res.sendStatus(500);
		}
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
