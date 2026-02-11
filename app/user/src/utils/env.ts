import dotenv from 'dotenv';

dotenv.config();

function requireEnvVar(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw Error(`Missing required environemnt variable: ${name}`);
	}
	return value;
}

export const AccessTokenExpiry: string =
	process.env.ACCESS_TOKEN_EXPIRY ?? '15m';
export const RefreshTokenExpiry: string =
	process.env.REFRESH_TOKEN_EXPIRY ?? '7d';
export const DATABASE_URL: string =
	process.env.DATABASE_URL ??
	"'postgresql://postgres:postgres@localhost:5432/foilctf'";
export const PORT: number = Number(process.env.PORT ?? '3001');

export const AccessTokenSecret: string = requireEnvVar('ACCESS_TOKEN_SECRET');
export const RefreshTokenSecret: string = requireEnvVar('REFRESH_TOKEN_SECRET');
export const AvatarsDir: string = process.env.AVATARS_DIR ?? 'avatars';
export const MaxFileSize: number = Number(
	process.env.MAX_FILE_SIZE ?? '2097152'
);
