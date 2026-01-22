
import	express, {Request, Response, NextFunction}	from 'express';
import	bcrypt						from 'bcrypt';
import	jwt, {VerifyErrors, VerifyCallback, JwtPayload}	from 'jsonwebtoken';
import	{ AccessTokenSecret, RefreshTokenSecret, PORT}	from './utils/env';
import	{ AccessTokenExpirationTime}			from './utils/env';
import	{ User, Post, AuthRequest}			from './utils/types';
import	{ authenticateToken, generateAccessToken}	from './utils/utils';
import	{ validateUserInput}				from './utils/utils';
import	{ users, posts}					from './utils/db';

let	refreshTokens: string[] = [];

const	app = express();
app.use(express.json());

app.get('/posts', authenticateToken, (req: AuthRequest, res: Response) => {
	//						-----v--- you gotta do what you gotta do
	res.json(posts.filter(post => post.username === (req as any).user.username))
});

app.get('/users', (req: AuthRequest, res: Response) => { // TO REMOVE !!
	res.json(users);
});

app.post('/register', async (req: AuthRequest, res: Response) => {
	try {
		const	userInput = validateUserInput(req);
		if (userInput) {
			res.sendStatus(userInput);
			return ;
		}
		const	salt		= await bcrypt.genSalt();
		const	hashedPassword	= await bcrypt.hash(req.body.password, salt);
		const	user: User	= {	username: req.body.username,
						email: req.body.email,
						password: hashedPassword
					  };
		users.push(user);
		res.sendStatus(201);
	}
	catch {
		res.sendStatus(500);
	}
});

app.post('/login', async (req: AuthRequest, res: Response) => {
	const	user = users.find(user => user.username === req.body.username);
	if (user == null) {
		res.status(400).send('Cannot find user');
		return ;
	}
	try {
		if (await bcrypt.compare(req.body.password, user.password)) {
			const	accessToken	= generateAccessToken(user.username);
			const	refreshToken	= jwt.sign(user, RefreshTokenSecret);
			refreshTokens.push(refreshToken);
			console.log(`access token will expire in: ${AccessTokenExpirationTime}`);
			res.json({ accessToken: accessToken, refreshToken: refreshToken});
		}
		else {
			res.send('Not allowed');
			return ;
		}
	}
	catch {
		res.sendStatus(500);
		return ;
	}
})

app.post('/token', (req: AuthRequest, res: Response) => {
	const	refreshToken = req.body.token;
	if (refreshToken == null) {
		res.sendStatus(401);
	}
	if (!refreshTokens.includes(refreshToken)) {
		res.sendStatus(403);
	}
	jwt.verify(refreshToken, RefreshTokenSecret, ((err: VerifyErrors | null, payload?: JwtPayload | string | undefined) => {
		if (err) {
			res.sendStatus(403);
			return ;
		}
		req.user = payload as User;
		const	newAccessToken = generateAccessToken(req.user.username);
		res.json({ accessToken: newAccessToken });
	}) satisfies VerifyCallback)
})

app.delete('/logout', (req: AuthRequest, res: Response) => {
	if (req.body.token === undefined) {
		res.status(400).send('No token specified');
		return;
	}
	if (!refreshTokens.includes(req.body.token)) {
		res.status(400).send(`The refreshToken you're trying to delete is does not exist`);
		return ;
	}
	refreshTokens = refreshTokens.filter(token => token !== req.body.token);
	res.send('Deleted successfully');
	return ;
})

app.listen(PORT, () => {
	console.log(`app listening on port ${PORT}`);
});
