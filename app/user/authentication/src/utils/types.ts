
import	express, {Request}	from 'express';
import	{ users, sessions}	from '../db/schema';
import	{z, Schema}		from 'zod';

export	type User	= typeof users.$inferInsert;
export	type Session	= typeof sessions.$inferInsert;

export	interface Post {
	username:	string,
	title:		string
}

export	interface AuthRequest extends Request {
	user?: User
}

export	const logout_refresh_Schema = z.object({
	cookies: z.object({
		jwt: z.string({ error: "Token is required"}),
	}),
});

export	const registerSchema = z.object({
	body: z.object({
		username:	z.string().min(3).max(15).regex(/^[a-zA-Z0-9_]+$/),
		email:		z.string().email(),
		password:	z.string().min(12),
	}),
});

export	const loginSchema = z.object({
	body: z.object({
		username:	z.string(), //.min(3).max(15).regex(/^[a-zA-Z0-9_]+$/),
		password:	z.string() //.min(12),
	}),
});
