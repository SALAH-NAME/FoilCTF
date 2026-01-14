import	express, { Request, Response, NextFunction}	from 'express';
import	session						from 'express-session';
import	passport					from 'passport';
import	dotenv						from 'dotenv';
import	FortyTwoStrategy				from 'passport-42';
import	path						form 'path';

dotenv.config();

const	port:		number	= Number(process.env.PORT); // ?? "8080");
const	appId:		string	= String(process.env.FORTYTWO_APP_ID);
const	appSecret:	string	= String(process.env.FORTYTWO_APP_SECRET);
const	sessionSecret:	string	= String(process.env.SESSION_SECRET);

//console.log(appId);
//console.log(appSecret);
//console.log(sessionSecret);

const	app			= express();

app.get('/', (req: Request, res: Response): void => {
	res.sendFile(path.join(__public, index.html));
	//res.send('Hello World');
})

app.listen(port, (): void => {
	console.log(`Example app listening on port ${port}`);
})
