
const	express	= require('express');
const	bcrypt	= require('bcrypt');
const	jwt	= require('jsonwebtoken');
const	dotenv	= require('dotenv');

dotenv.config();

const	app = express();
app.use(express.json());

// data base
const	users = [];
const	posts = [
	{
		name:	"yasser",
		title:	"post1"
	},
	{
		name:	"user2",
		title:	"post2"
	},
]
let	refreshTokens = [];
// data base

function	generateAccessToken(name) {
	return jwt.sign({ name: name }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1m' });
}

app.post('/token', (req, res) => {
	const	refreshToken = req.body.token;
	if (refreshToken == null) {
		res.sendStatus(401);
	}
	if (!refreshTokens.includes(refreshToken)) {
		res.sendStatus(403);
	}
	jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
		if (err)
			res.sendStatus(403);
		const	blabla = generateAccessToken(user.name);
		res.json({ accessToken: blabla});
	})
})

app.get('/users', (req, res) => { // REMOVE: just for testing purposes
	res.json(users);
})

app.get('/posts', authenticateToken, (req, res) => {
	res.json(posts.filter(post => post.name === req.user.name));
})

app.post('/users', async (req, res) => {
	try {
		const	salt = await bcrypt.genSalt();
		const	hashedPassword = await bcrypt.hash(req.body.password, salt);
		user = { name: req.body.name, password: hashedPassword};
		users.push(user);
		res.status(201).send();
	} catch {
		res.status(500).send();
	}
})

app.post('/users/login', async (req, res) => {
	const	user = users.find(user => user.name === req.body.name);
	if (user == null)
		return res.status(400).send('cannot find user');
	try {
		if (await bcrypt.compare(req.body.password, user.password)) {
			const	accessToken	= generateAccessToken(user.name);
			const	refreshToken	= jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
			refreshTokens.push(refreshToken);
			res.json({ accessToken: accessToken, refreshToken: refreshToken});
		}
		else {
			res.send('not allawed');
		}
	}
	catch {
		res.status(500).send();
	}
})

function	authenticateToken(req, res, next) {
	const	authHeader	= req.get('authorization');
	const	[bearer, token]	= authHeader && authHeader.split(' ');
	if (token === undefined || bearer !== 'Basic')
		return res.sendStatus(401);

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
		if (err)
			return res.sendStatus(403);
		req.user = user;
		next();
	});
}

app.delete('/logout', (req, res) => {
	refreshTokens.filter(token => token !== req.body.token);
	res.send(204);
})

app.listen(3000, () => console.log('app listening on 3000'));
