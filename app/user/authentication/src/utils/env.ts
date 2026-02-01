
import	dotenv	from 'dotenv';

dotenv.config();

function	requireEnvVar(name: string): string {
	const	value = process.env[name];
	if (!value) {
		throw Error(`Missing required environemnt variable: ${name}`);
	}
	return value;
}

export	const	AccessTokenSecret:		string = requireEnvVar("ACCESS_TOKEN_SECRET");
export	const	RefreshTokenSecret:		string = requireEnvVar("REFRESH_TOKEN_SECRET");
export	const	AccessTokenExpiry:		string = requireEnvVar("ACCESS_TOKEN_EXPIRY");
export	const	RefreshTokenExpiry:		string = requireEnvVar("REFRESH_TOKEN_EXPIRY");
export	const	DATABASE_URL:			string = requireEnvVar("DATABASE_URL");
export	const	PORT:				number = Number(requireEnvVar("PORT"));
