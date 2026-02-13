import { drizzle } from 'drizzle-orm/node-postgres';
import { DATABASE_URL } from './env';

export const db = drizzle({ connection: DATABASE_URL });
