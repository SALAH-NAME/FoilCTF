import	express, {Request, Response, NextFunction}	from 'express';
import	session						from 'express-session';
import	passport					from 'passport';
import	dotenv						from 'dotenv';
import	FortyTwoStrategy				from 'passport-42';
import	path						from 'path';
import	{User, FortyTwoProfile, DonePassport}		from './types';

dotenv.config();

const	Port:		number	= Number(process.env.PORT ?? "8080");
const	AppId:		string	= process.env.FORTYTWO_APP_ID ?? "ID";
const	AppSecret:	string	= process.env.FORTYTWO_APP_SECRET ?? "42Secret";
const	SessionSecret:	string	= process.env.SESSION_SECRET ?? "SSecret";

import	'./auth/passport';

//console.log(Port);
//console.log(AppId);
//console.log(AppSecret);
//console.log(SessionSecret);

//function	consoleUserInfos(user?: User | undefined): void { // DEBUG
//	console.table([user], ["id", "username", "kind", "displayname"]);
//}

function	isLoggedIn(req: Request, res: Response, next: NextFunction): void {
	req.user ? next() : res.sendStatus(401);
}

//const	app = express();



class	Server {
	public	app = express();

	constructor() {
		this.setupMiddleWares();
		this.setupRoutes();
	};

	private	setupMiddleWares() {
		this.app.use(session({	secret:			SessionSecret,
						resave:			false,
						saveUninitialized:	false,
						cookie:			{secure: false} // HTTP
					})
			       );
		this.app.use(passport.initialize());
		this.app.use(passport.session());
	};

	private setupRoutes() {
		this.app.get('/', (req: Request, res: Response): void => {
			res.sendFile(path.join(__dirname, '../public/home.html'));
		});

		this.app.get('/auth/42',
			passport.authenticate('42')
		);

		this.app.get('/auth/42/callback',
			passport.authenticate('42', {
				successRedirect: '/private',
				failureRedirect: '/auth/failure',
			})
		);

		this.app.get('/auth/failure', (req: Request, res: Response): void => {
			res.send('Something went wrong..');
		});

		this.app.get('/private', isLoggedIn, (req: Request, res: Response): void => {
			res.send(`Hello ${req.user?.displayname ?? "GUEST"}
				 <br><a href="/logout">logout?</a>`); // button maybe?
								      // to exec logout func
		});

		this.app.get('/logout', (req: Request, res: Response) => {
			req.logout((err): void => {
				if (err) {
					res.status(500).send('Error loggin out');
					return ;
				}
				req.session.destroy((err) => {
					if (err) {
						res.status(500).send('Error loggin out');
						return ;
					}
					//res.send('Goodbye!');
					res.clearCookie('connect.sid', { path: '/'});
					res.redirect('/');
				});
			});
		});
	};

	public	listen(Port: number) {
		this.app.listen(Port, (): void => {
			console.log(`app listening on port ${Port}`);
		});
	};
}

const	server = new Server();
server.listen(Port);
