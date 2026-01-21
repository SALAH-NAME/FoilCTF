
import	dotenv		from 'dotenv';

dotenv.config();

const   Port:           	number  = Number(process.env.PORT ?? "8080");
const   AppId:          	string  = process.env.FORTYTWO_APP_ID ?? "ID";
const   AppSecret:      	string  = process.env.FORTYTWO_APP_SECRET ?? "42Secret";
const   SessionSecret:  	string  = process.env.SESSION_SECRET ?? "SSecret";
const	AccessTokenSecret:	string	= process.env.ACCESS_TOKEN_SECRET ?? "ATSecret";

export	{Port, AppId, AppSecret, SessionSecret, AccessTokenSecret};
