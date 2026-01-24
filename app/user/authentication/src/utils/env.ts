
import	dotenv	from 'dotenv';

dotenv.config();

export	const	AccessTokenSecret		= process.env.ACCESS_TOKEN_SECRET ?? "ATSecret";
export	const	RefreshTokenSecret		= process.env.REFRESH_TOKEN_SECRET ?? "RTSECRET";
export	const	PORT				= Number(process.env.PORT ?? "3030");
export	const	AccessTokenExpirationTime	= process.env.ACCESS_TOKEN_EXPIRATION_TIME ?? "15m";
export	const	DATABASE_URL			= process.env.DATABASE_URL ?? "DBURL";
