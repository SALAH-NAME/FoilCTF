import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

import {
	ENV_DATABASE_HOST,
	ENV_DATABASE_PORT,
	ENV_DATABASE_USER,
	ENV_DATABASE_PASS,
	ENV_DATABASE_NAME,
} from '../env.js';

const DATABASE_URL = `postgresql://${ENV_DATABASE_USER}:${ENV_DATABASE_PASS}@${ENV_DATABASE_HOST}:${ENV_DATABASE_PORT}/${ENV_DATABASE_NAME}?sslmode=disable`;
export const pool = new Pool({ connectionString: DATABASE_URL });
export const orm = drizzle({ client: pool });

export * from './entities/schema.js';
export * from './entities/relations.js';
export default orm;
