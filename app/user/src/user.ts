import { hash } from 'bcrypt';
import { and, eq, or, ilike } from 'drizzle-orm';
import type { Request, Response, NextFunction } from 'express';

import { db } from './utils/db';
import { User } from './utils/types';
import { JWT_Payload } from './jwt';
import { SALT_ROUNDS } from './auth';
import {
	password_validate,
	user_exists_email,
	user_exists_username,
} from './utils/utils';
import {
	users as table_users,
	profiles as table_profiles,
	friends as table_friends,
	friend_requests as table_friend_requests,
	team_join_requests as table_team_requests,
} from './db/schema';

// TODO(xenobas): Continue the work on Request to Join matching the database status
export async function route_user_me(
	_req: Request,
	res: Response<any, { user: JWT_Payload }>
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

export async function route_user_list(
	req: Request,
	res: Response<any, { user?: JWT_Payload }>
) {
	const search = (req.query.q as string) ?? '';
	const page = Math.max(Number(req.query.page) || 1, 1);
	const limit = Math.max(Number(req.query.limit) || 10, 1);

	const or_conditions = [];
	if (search) {
		or_conditions.push(eq(table_users.username, search));
		or_conditions.push(ilike(table_users.username, '%' + search + '%'));
	}

	type FriendStatus = 'none' | 'sent' | 'received' | 'friends';

	const { user: user_dispatcher } = res.locals;
	const orm_on_profiles = eq(table_profiles.username, table_users.username);

	if (user_dispatcher) {
		const orm_on_friends = or(
			and(
				eq(table_friends.username_1, table_users.username),
				ilike(table_friends.username_2, user_dispatcher?.username ?? '')
			),
			and(
				eq(table_friends.username_2, table_users.username),
				ilike(table_friends.username_1, user_dispatcher?.username ?? '')
			)
		);
		const orm_on_friend_requests = or(
			eq(table_friend_requests.sender_name, table_users.username),
			eq(table_friend_requests.receiver_name, table_users.username)
		);
		const orm_select = {
			user: table_users,
			profile: table_profiles,
			friendship: table_friends,
			friend_request: table_friend_requests,
		};

		const orm_users = await db
			.selectDistinctOn([table_users.username], orm_select)
			.from(table_users)
			.leftJoin(table_friends, orm_on_friends)
			.leftJoin(table_profiles, orm_on_profiles)
			.leftJoin(table_friend_requests, orm_on_friend_requests)
			.where(or(...or_conditions))
			.limit(limit)
			.offset(limit * (page - 1));

		const calculateFriendStatus = ({
			user,
			friendship,
			friend_request,
		}: (typeof orm_users)[number]): FriendStatus => {
			if (user.username === user_dispatcher?.username) return 'none';
			if (
				friendship?.username_1 === user_dispatcher?.username ||
				friendship?.username_2 === user_dispatcher?.username
			)
				return 'friends';
			if (friend_request?.sender_name === user_dispatcher?.username)
				return 'sent';
			if (friend_request?.receiver_name === user_dispatcher?.username)
				return 'received';
			return 'none';
		};
		const users = orm_users.map((orm_user) => {
			const { user, profile, friendship, friend_request } = orm_user;
			return {
				id: user.id,
				role: user.role,
				username: user.username,
				team_name: user.team_name,

				avatar: profile?.avatar ?? null,
				total_points: profile?.totalpoints ?? null,
				challenges_solved: profile?.challengessolved ?? null,

				friend_1: friendship?.username_1,
				friend_2: friendship?.username_2,

				request_sender: friend_request?.sender_name,
				request_receiver: friend_request?.receiver_name,

				friend_status: calculateFriendStatus(orm_user),
			};
		});

		return res
			.status(200)
			.json({
				data: users,
				limit,
				page,
			})
			.end();
	}

	const orm_users = await db
		.selectDistinctOn([table_users.username], {
			user: table_users,
			profile: table_profiles,
		})
		.from(table_users)
		.leftJoin(table_profiles, orm_on_profiles)
		.where(or(...or_conditions))
		.limit(limit)
		.offset(limit * (page - 1));

	const calculateFriendStatus = (
		_user: (typeof orm_users)[number]
	): FriendStatus => {
		return 'none';
	};
	const users = orm_users.map((orm_user) => {
		const { user, profile } = orm_user;
		return {
			id: user.id,
			role: user.role,
			username: user.username,
			team_name: user.team_name,

			avatar: profile?.avatar ?? null,
			total_points: profile?.totalpoints ?? null,
			challenges_solved: profile?.challengessolved ?? null,

			friend_1: null,
			friend_2: null,

			request_sender: null,
			request_receiver: null,

			friend_status: calculateFriendStatus(orm_user),
		};
	});

	return res
		.status(200)
		.json({
			data: users,
			limit,
			page,
		})
		.end();
}

export async function route_user_update(
	req: Request,
	res: Response<any, { user: JWT_Payload }>,
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

export async function route_user_me_requests(
	_req: Request,
	res: Response<any, { user: JWT_Payload }>
) {
	const { username } = res.locals.user;
	const requests = await db
		.select({ team_name: table_team_requests.team_name })
		.from(table_team_requests)
		.where(eq(table_team_requests.username, username));
	return res
		.status(200)
		.json({ data: requests.map((x) => x.team_name) })
		.end();
}
