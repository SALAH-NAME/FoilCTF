import	express, { Request, Response, NextFunction}	from 'express';
import	session						from 'express-session';
import	passport					from 'passport';
import	dotenv						from 'dotenv';
//import	{ FortyTwoStrategy, FortyTwoProfile}		from 'passport-42';
import	FortyTwoStrategy				from 'passport-42';
import	path						from 'path';

declare	global {
	namespace	Express {
		interface	User {
			id:		string;
			username:	string;
			kind:		string;
			displayname:	string;
		}
	}
}

dotenv.config();

const	port:		number	= Number(process.env.PORT); // ?? "8080");
const	appId:		string	= String(process.env.FORTYTWO_APP_ID);
const	appSecret:	string	= String(process.env.FORTYTWO_APP_SECRET);
const	sessionSecret:	string	= String(process.env.SESSION_SECRET);

//console.log(port);
//console.log(appId);
//console.log(appSecret);
//console.log(sessionSecret);

interface	User {
	id:		string;
	username:	string;
	kind:		string;
	displayname:	string;
}

interface FortyTwoProfile {
	id:		string;
	username:	string;
	displayName:	string;
	_json: {
	    kind: string;
	    [key: string]: any; 
	};
}

type	VerifyCallback = (err: Error | null, user?: User | false) => void;

const	verifyUser = async (
	req:		Request,
	accessToken:	string,
	refreshToken:	string,
	profile:	FortyTwoProfile,
	done:		VerifyCallback
) => {
	try {
		if (!profile || profile._json.kind !== 'student')
			return done(null, false);
		const	user = {
			id:		profile.id,
			username:	profile.username,
			kind:		profile._json.kind,
			displayname:	profile.displayName
		};

		return done(null, user);
	} catch (error) {
		return done(error instanceof Error ? error : new Error("Auth Failed"));
	}
}

passport.use(new FortyTwoStrategy({
	clientID:		appId,
	clientSecret:		appSecret,
	callbackURL:		`http://localhost:${port}/auth/42/callback`,
	passReqToCallback:	true,
	profileFields: {
		'id':		'id',
		'username':	'username',
		'kind':		'kind',
		'displayname':	'displayName'
		}
	}, verifyUser));

passport.serializeUser((user: User, done): void => {
	done(null, user.id);
});

// DATA BASE!
//passport.deserializeUser(async (id: string, done): void => {
//	const	user = db.findUserById(id);
//	done(null, user);
//})

passport.deserializeUser((user: User, done): void => {
	done(null, user);
});

const	app			= express();

app.get('/', (req: Request, res: Response): void => {
	res.sendFile(path.join(__dirname, 'public/index.html'));
})

app.get('/auth/42',
	passport.authenticate('42')
);

app.get('/protected', (req: Request, res: Response): void => {
	res.send(`Hello ${req.user ? req.user.displayname : "MATHA FACKA"}`);
})

app.listen(port, (): void => {
	console.log(`Example app listening on port ${port}`);
})
