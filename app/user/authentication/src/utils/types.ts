
import	express, {Request}	from 'express';

export	interface User {
	username:	string,
<<<<<<< HEAD
	email:		string,
=======
>>>>>>> b810b2e9401a409782c9b37ff8e12aedd4a38dcd
	password:	string
}

export	interface Post {
	username:	string,
	title:		string
}

export	interface AuthRequest extends Request {
	user?: User
}
