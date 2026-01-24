
import	{ pgTable, uuid, varchar, unique }	from 'drizzle-orm/pg-core';

export	const UserTable = pgTable("users", {
	id:	uuid("id").primaryKey().defaultRandom(),
	name:	varchar("name", { length: 255 }).notNull(),
	email:	varchar("email", {length: 255 }).notNull(),
},	(table) => [
	unique("users_email_unique").on(table.email)
]);
