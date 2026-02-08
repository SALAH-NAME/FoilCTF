import	'dotenv/config';
import	bcrypt						from 'bcrypt';
import	express, {Response, NextFunction}		from 'express';
import	jwt, {JwtPayload}				from 'jsonwebtoken';
import	{ eq, or}					from 'drizzle-orm';
import	{ users, sessions, profiles }			from './db/schema';
import	{ db}						from './utils/db';
import	ms, {StringValue}				from 'ms';
import	path						from 'path';
import	{	RefreshTokenSecret,
		PORT,
		RefreshTokenExpiry,
		AccessTokenSecret,
		AvatarsDir,
	}						from './utils/env';
import	{ ZodError}					from 'zod';
import	cookieParser					from 'cookie-parser';
import	{	User,
		Profile,
		AuthRequest,
		registerSchema,
		loginSchema,
		updateProfileSchema,
		}					from './utils/types';

import	{
		generateAccessToken,
		validate,
		authenticateToken,
	}						from './utils/utils';
import	{
		getProfile,
		authenticateTokenProfile,
		updateProfile,
		uploadAvatar,
		upload,
		//getAvatar,
	}						from './utils/profile';
import	multer, {FileFilterCallback}			from 'multer';

const	app = express();
app.use(express.json());
app.use(cookieParser());

const	register = async (req: AuthRequest, res: Response) => {
	try {
		const	{username, email, password} = req.body;
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
		await db.insert(profiles).values({ // user profile creation on registry
							username:		username,
							challengessolved:	0,
							eventsparticipated:	0,
							totalpoints:		0
						});
		console.log(`New user created: ${username}`);
		res.sendStatus(201);
	}
	catch (err) {
		console.error(err);
		res.sendStatus(500);
	}
};

const	login = async (req: AuthRequest, res: Response) => {
	const	{username, password} = req.body;
	try {
		const	[user] = await db.select().from(users).where(eq(users.username, username));
		const	passwordIsValid = await bcrypt.compare(password,
						user?.password ?? "$2b$10$dummyhashplaceholder");
		if (user === undefined || !passwordIsValid) {
			res.status(401).send('Invalid username or password');
			return ;
		}

		const	accessToken		= generateAccessToken(user.username as any, user.role, user.id);
		const	refreshToken		= jwt.sign(	{username: user.username, id: user.id},
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
};

const	refresh = async (req: AuthRequest, res: Response) => {
	try {
		const	token = req.cookies?.jwt ?? ""; // cookie or auth header?
		jwt.verify(token, RefreshTokenSecret) as JwtPayload;

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
		const	newAccessToken = generateAccessToken(user.username as string, user.role, user.id);
		res.json({ accessToken: newAccessToken });
	} catch (err) {
		return res.sendStatus(403);
	}
};

const	logout = async (req: AuthRequest, res: Response) => {
	try {
		const	token = req.cookies?.jwt; // cookie or auth header?
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
};

app.post('/api/auth/register',
	validate(registerSchema),
	register);
app.post('/api/auth/login',
	validate(loginSchema),
	login);
app.post('/api/auth/refresh',
	refresh);
app.delete('/api/auth/logout',
	logout);

app.get('/api/profiles/:username',
	authenticateTokenProfile,
	getProfile);
app.post('/api/profiles/:username/avatar',
	authenticateToken,
	upload.single('avatar'),
	uploadAvatar);
app.put('/api/profiles/:username',
	authenticateToken,
	validate(updateProfileSchema),
	updateProfile);

app.use((err: any, req: AuthRequest, res: Response, next: NextFunction) => {
	if (err instanceof ZodError) {
		return res.status(400).send(`zod error`);
	}
	if (err instanceof multer.MulterError) {
		return res.status(400).json({ code: err.code, message: err.message });
	}
	if (err.message === 'Invalid file type') {
		return res.status(400).json({ error: 'Only images are allowed' });
	}
	console.error(err);
	res.sendStatus(500);
})

app.listen(PORT, () => {
	console.log(`app listening on port ${PORT}`);
});
