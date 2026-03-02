import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	out: './src/orm/entities/',
	schema: './src/orm/entities/schema.ts',

	dialect: 'postgresql',
	introspect: {
		casing: 'preserve',
	},
	dbCredentials: {
		ssl: false,
		host: process.env.DATABASE_HOST ?? "localhost",
		port: parseInt(process.env.DATABASE_PORT ?? "5432"),
		user: process.env.DATABASE_USER ?? "postgres",
		password: process.env.DATABASE_PASS ?? "postgres",
		database: process.env.DATABASE_NAME ?? "foilctf",
	},
});
