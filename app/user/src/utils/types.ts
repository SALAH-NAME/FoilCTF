
import	{Request}			from 'express';
import	{ users, sessions, profiles}	from '../db/schema';
import	{z}				from 'zod';

export	type User	= typeof users.$inferInsert;
export	type Session	= typeof sessions.$inferInsert;
export	type Profile	= typeof profiles.$inferInsert;

export	interface Post {
	username:	string,
	title:		string
}

export	interface AuthRequest extends Request {
	user?: User
}

export	const registerSchema = z.object({ // trim spaces
	body: z.object({
		username:	z.string().trim().min(3).max(15).regex(/^[a-zA-Z0-9_-]+$/), // add '-', so yait-nas is valid
		email:		z.string().trim().email({ pattern: z.regexes.email }), // is this ok?
		password:	z.string().trim().min(12),
	}),
});

export	const loginSchema = z.object({ // same here
	body: z.object({
		username:	z.string().trim().min(3).max(15).regex(/^[a-zA-Z0-9_-]+$/), // same here
		password:	z.string().trim().min(12),
	}),
});
