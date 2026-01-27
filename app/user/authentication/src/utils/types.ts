
import	express, {Request}	from 'express';
import	{ users, sessions}	from '../db/schema';

export	type User	= typeof users.$inferInsert;
export	type Session	= typeof sessions.$inferInsert;

export	interface Post {
	username:	string,
	title:		string
}

export	interface AuthRequest extends Request {
	user?: User
}

