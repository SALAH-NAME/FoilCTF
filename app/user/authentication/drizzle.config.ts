
import	{ defineConfig }	from 'drizzle-kit';
import	{ DATABSE_URL }		from './src/utils/env';

export	default defineConfig({
	out:		"./src/drizzle/migrations",
	schema: 	"./src/drizzle/schema.ts",
	driver:		"pg",
	dbCredentials: {
		url:	DATABSE_URL!,
	},
	verbose:	true,
	strict:		true,
});
