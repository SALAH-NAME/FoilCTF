import ms from 'ms';
import dotenv from 'dotenv';

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

export const AccessTokenSecret: string = requireEnvVar('ACCESS_TOKEN_SECRET');
export const RefreshTokenSecret: string = requireEnvVar('REFRESH_TOKEN_SECRET');
export const MaxFileSize: number = Number(
	process.env.MAX_FILE_SIZE ?? '2097152'
);

export const ENV_OAUTH_42_UID = requireEnvVar('OAUTH_42_UID');
export const ENV_OAUTH_42_SECRET = requireEnvVar('OAUTH_42_SECRET');
export const AvatarsDir: string = process.env.AVATARS_DIR ?? 'uploads/avatars';

export const PASSWORD_MIN_CHARACTERS: number = Number(
	process.env.PASSWORD_MIN_CHARACTERS ?? '8'
);
export const PASSWORD_MAX_CHARACTERS: number = Number(
	process.env.PASSWORD_MAX_CHARACTERS ?? '64'
);

export const PORT: number = Number(process.env.PORT ?? '3001');
export const DATABASE_URL: string = requireEnvVar('DATABASE_URL');
