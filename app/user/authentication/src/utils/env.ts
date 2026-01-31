
import	dotenv	from 'dotenv';

dotenv.config();

export	const	AccessTokenSecret:		string = process.env.ACCESS_TOKEN_SECRET ?? "ATSecret";
export	const	RefreshTokenSecret:		string = process.env.REFRESH_TOKEN_SECRET ?? "RTSECRET";
export	const	PORT:				number = Number(process.env.PORT ?? "3030");
export	const	AccessTokenExpirationTime:	string = process.env.ACCESS_TOKEN_EXPIRATION_TIME ?? "15m";
export	const	RefreshTokenExpirationTime:	string = process.env.REFRESH_TOKEN_EXPIRATION_TIME ?? "15m";
export	const	DATABASE_URL:			string = process.env.DATABASE_URL ?? "DBURL";
