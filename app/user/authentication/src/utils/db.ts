
//import	{User, Post, AuthRequest}	from './types';

//export	const	users:	User[] = [];
//export	const	posts:	Post[] = [
//	{
//		username: "yasser",
//		title: "post1"
//	},
//	{
//		username: "user2",
//		title: "post2"
//	}
//];

import	{ drizzle }	from 'drizzle-orm/node-postgres';
import	{ DATABASE_URL}	from './env';

export	const	db = drizzle(DATABASE_URL!);

