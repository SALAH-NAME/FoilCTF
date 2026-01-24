
import	{ DATABASE_URL }	from '../utils/env';
import	{ drizzle }		from 'drizzle-orm/postgres-js';
import	{ migrate }		from 'postgres';
import	{ postgres }		from 'postgres';

const	migrationClient = postgres(DATABASE_URL, { max: 1 });

function	main() {
	await	migrate(drizzle(migrationClient), {
		migrationFolder: "./migrations"
	});

	await	migrationClient.end();
}

main();
