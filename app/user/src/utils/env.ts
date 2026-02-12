import dotenv from 'dotenv';
import ms from 'ms';

dotenv.config({
	quiet: true,
});

function requireEnvVar(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw Error(`Missing required environemnt variable: ${name}`);
	}
	return value;
}

export const AccessTokenExpiry = (process.env.ACCESS_TOKEN_EXPIRY ??
	'15m') as ms.StringValue;
export const RefreshTokenExpiry = (process.env.REFRESH_TOKEN_EXPIRY ??
	'7d') as ms.StringValue;
export const DATABASE_URL: string =
	process.env.DATABASE_URL ??
	"'postgresql://postgres:postgres@localhost:5432/foilctf'";
export const PORT: number = Number(process.env.PORT ?? '3001');

export const AccessTokenSecret: string = requireEnvVar('JWT_SECRET');
export const RefreshTokenSecret: string = requireEnvVar('JWT_SECRET');
export const AvatarsDir: string = process.env.AVATARS_DIR ?? 'avatars';
export const MaxFileSize: number = Number(
	process.env.MAX_FILE_SIZE ?? '2097152'
);

export const ENV_OAUTH_42_UID = requireEnvVar('OAUTH_42_UID');
export const ENV_OAUTH_42_SECRET = requireEnvVar('OAUTH_42_SECRET');
