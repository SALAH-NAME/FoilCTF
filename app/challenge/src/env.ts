import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export const ENV_API_PORT = Number(process.env['API_PORT']);
if (isNaN(ENV_API_PORT)) throw new Error('Please set API_PORT');

export const ENV_API_HOST = process.env['API_HOST'] ?? '';
if (ENV_API_HOST === '') throw new Error('Please set API_HOST');

export const ENV_DATABASE_HOST = process.env['DATABASE_HOST'] ?? '';
if (ENV_DATABASE_HOST === '') throw new Error('Please set DATABASE_HOST');

export const ENV_DATABASE_PORT = Number(process.env['DATABASE_PORT']);
if (isNaN(ENV_DATABASE_PORT)) throw new Error('Please set DATABASE_PORT');
if (ENV_DATABASE_PORT < 0 || ENV_DATABASE_PORT > 65535)
	throw new Error(`Out of bounds DATABASE_PORT '${ENV_DATABASE_PORT}'`);

export const ENV_DATABASE_USER = process.env['DATABASE_USER'] ?? '';
if (ENV_DATABASE_USER === '') throw new Error('Please set DATABASE_USER');

export const ENV_DATABASE_PASS = process.env['DATABASE_PASS'] ?? '';
if (ENV_DATABASE_PASS === '') throw new Error('Please set DATABASE_PASS');

export const ENV_DATABASE_NAME = process.env['DATABASE_NAME'] ?? '';
if (ENV_DATABASE_NAME === '') throw new Error('Please set DATABASE_NAME');

export const ENV_SANDBOX_ORIGIN = process.env['SANDBOX_ORIGIN'] ?? '';
if (ENV_SANDBOX_ORIGIN === '') throw new Error('Please set SANDBOX_ORIGIN');
