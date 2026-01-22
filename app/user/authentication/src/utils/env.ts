
import	dotenv	from 'dotenv';

dotenv.config();

export	const	ACCESS_TOKEN_SECRET	= process.env.ACCESS_TOKEN_SECRET ?? "ATSecret";
export	const	REFRESH_TOKEN_SECRET	= process.env.REFRESH_TOKEN_SECRET ?? "RTSECRET";
export	const	PORT			= Number(process.env.PORT ?? "3000");
