import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const ENV_API_PORT = Number(process.env['API_PORT']);
if (isNaN(ENV_API_PORT)) throw new Error('Please set API_PORT');

const ENV_API_HOST = process.env['API_HOST'] ?? '';
if (ENV_API_HOST === '') throw new Error('Please set API_HOST');

const ENV_DATABASE_HOST = process.env['DATABASE_HOST'] ?? '';
if (ENV_DATABASE_HOST === '') throw new Error('Please set DATABASE_HOST');

const ENV_DATABASE_PORT = Number(process.env['DATABASE_PORT']);
if (isNaN(ENV_DATABASE_PORT)) throw new Error('Please set DATABASE_PORT');
if (ENV_DATABASE_PORT < 0 || ENV_DATABASE_PORT > 65535)
	throw new Error(`Out of bounds DATABASE_PORT '${ENV_DATABASE_PORT}'`);

const ENV_DATABASE_USER = process.env['DATABASE_USER'] ?? '';
if (ENV_DATABASE_USER === '') throw new Error('Please set DATABASE_USER');

const ENV_DATABASE_PASS = process.env['DATABASE_PASS'] ?? '';
if (ENV_DATABASE_PASS === '') throw new Error('Please set DATABASE_PASS');

const ENV_DATABASE_NAME = process.env['DATABASE_NAME'] ?? '';
if (ENV_DATABASE_NAME === '') throw new Error('Please set DATABASE_NAME');

export {
	ENV_API_PORT,
	ENV_API_HOST,
	ENV_DATABASE_HOST,
	ENV_DATABASE_PORT,
	ENV_DATABASE_USER,
	ENV_DATABASE_PASS,
	ENV_DATABASE_NAME,
};
