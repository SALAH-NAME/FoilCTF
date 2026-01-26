
import	express, {Request}	from 'express';
import	{ users}		from '../db/schema';

export	type User = typeof users.$inferInsert;

export	interface Post {
	username:	string,
	title:		string
}

export	interface AuthRequest extends Request {
	user?: User
}
