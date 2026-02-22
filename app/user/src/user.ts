import { eq } from 'drizzle-orm';
import { hash } from 'bcrypt';
import type { Request, Response, NextFunction } from 'express';

import { db } from './utils/db';
import { User } from './utils/types';
import { SALT_ROUNDS } from './auth';
import { users as table_users } from './db/schema';
import { password_validate, user_exists, user_exists_email, user_exists_username } from './utils/utils';

export async function route_user_me(
	_req: Request,
	res: Response<any, { user: { username: string; role: string; id: number } }>
) {
	const { user: user_token_data } = res.locals;

	const [user]: Partial<User>[] = await db
		.select()
		.from(table_users)
		.where(eq(table_users.id, user_token_data.id));
	delete user!['password'];

	res
		.status(200)
		.header('Content-Type', 'application/json')
		.send(JSON.stringify(user))
		.end();
}

export async function route_user_update(
	req: Request,
	res: Response<any, { user?: User }>,
	next: NextFunction
) {
	if (!req.body || !res.locals.user)
		return res.status(400).json({ error: 'Invalid request format' }).end();

	const user = res.locals.user;
	if (user.username !== req.params.username)
		return res.status(403).json({ error: 'Unauthorized' }).end();

	const { username, email, password, password_new } = req.body;
	if (!username && !email && !password_new)
		return res
			.status(400)
			.json({
				error: 'Update payload must contain at least one property to update',
			})
			.end();

	if (!password)
		return res
			.status(400)
			.json({ error: 'Required password was not provided' })
			.end();
	const passwords_match = await password_validate(
		password,
		res.locals.user.username
	);
	if (!passwords_match)
		return res.status(401).json({ error: 'Incorrect password' }).end();

	if (email) {
		const user_exists = await user_exists_email(email);
		if (user_exists)
			return res.status(409).json({ error: 'Email already used' }).end();
	}
	if (username) {
		const user_exists = await user_exists_username(username);
		if (user_exists)
			return res.status(409).json({ error: 'Username already taken' }).end();
	}

	let password_salt: string | undefined;
	if (password_new) {
		password_salt = await hash(password_new, SALT_ROUNDS);
	}

	await db
		.update(table_users)
		.set({
			username: username,
			email: email,
			password: password_salt,
		})
		.where(eq(table_users.id, user.id));

	next();
}
