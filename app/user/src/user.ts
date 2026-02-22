import { eq } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { db } from './utils/db';
import { User } from './utils/types';
import { users as table_users } from './db/schema';

export async function route_user_me(
	_req: Request,
	res: Response<any, { user: { username: string; role: string; id: number } }>
) {
	const { user: jwt } = res.locals;

	const [user]: Partial<User>[] = await db
		.select()
		.from(table_users)
		.where(eq(table_users.id, jwt.id));
	delete user!['password'];

	res
		.status(200)
		.header('Content-Type', 'application/json')
		.send(JSON.stringify(user))
		.end();
}
