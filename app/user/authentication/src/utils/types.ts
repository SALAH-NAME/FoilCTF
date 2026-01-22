
import	express, {Request}	from 'express';

export	interface User {
	username:	string,
	password:	string
}

export	interface Post {
	username:	string,
	title:		string
}

export	interface AuthRequest extends Request {
	user?: User
}
