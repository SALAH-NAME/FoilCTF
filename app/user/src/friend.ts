import { NextFunction, Request, Response } from 'express';
import {
	friends,
	friend_requests,
	users,
	notifications,
	notification_users,
} from './db/schema';
import { db } from './utils/db';
import { eq, and, or, ilike } from 'drizzle-orm';

export class FoilCTF_Error extends Error {
	public statusCode: number;
	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;

		this.name = 'FoilCTF_Error';
	}

	toJSON() {
		return {
			error: true,
			message: this.message,
			status: this.statusCode,
		};
	}
}

export class FoilCTF_Success {
	public statusCode: number;
	public message: string;

	constructor(message: string, statusCode: number) {
		this.statusCode = statusCode;
		this.message = message;
	}

	toJSON() {
		return {
			message: this.message,
			status: this.statusCode,
		};
	}
}

export async function listFriends(
	req: Request,
	res: Response,
	_next: NextFunction
) {
	const decodedUser = res.locals.user;
	const limit = Math.max(Number(req.query.limit) || 10, 1);
	const page = Math.max(Number(req.query.page) || 1, 1);
	const search = req.query.q as string;

	const searchFilter = search
		? or(
				and(
					eq(friends.username_1, decodedUser.username),
					search ? ilike(friends.username_2, `%${search}%`) : undefined,
				),
				and(
					eq(friends.username_2, decodedUser.username),
					search ? ilike(friends.username_1, `%${search}%`) : undefined,
				)
			)
		: or(
				eq(friends.username_1, decodedUser.username),
				eq(friends.username_2, decodedUser.username)
			);

	const dbFriends = await db
		.select()
		.from(friends)
		.where(searchFilter)
		.limit(limit)
		.offset(limit * (page - 1));

	const decodedUserFriends = dbFriends.map((row) =>
		row.username_1 === decodedUser.username ? row.username_2 : row.username_1
	);

	return res.status(200).json({
		data: decodedUserFriends,
		limit,
		page,
	});
}

export async function listFriendRequests(
	req: Request,
	res: Response,
	_next: NextFunction
) {
	const decodedUser = res.locals.user;

	const limit = Math.max(Number(req.query.limit) || 10, 1);
	const page = Math.max(Number(req.query.page) || 1, 1);
	const search = req.query.q as string;

	const filters = [eq(friend_requests.receiver_name, decodedUser.username), eq(friend_requests.sender_name, decodedUser.username)];
	if (search) filters.push(ilike(friend_requests.sender_name, `${search}%`), ilike(friend_requests.receiver_name, `${search}%`));

	const requests = await db
		.select()
		.from(friend_requests)
		.where(or(...filters))
		.limit(limit)
		.offset(limit * (page - 1));
	return res.status(200).json({
		data: requests,
		limit,
		page,
	});
}

export async function sendFriendRequest(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const target = req.params.username as string;
	const decodedUser = res.locals.user;

	if (target === decodedUser.username)
		return res
			.status(403)
			.json(new FoilCTF_Error('No self requests allowed', 403));

	await db.transaction(async (tx) => {
		const [dbUser] = await tx
			.select()
			.from(users)
			.where(eq(users.username, target));
		if (!dbUser) {
			throw new FoilCTF_Error('No such user', 403);
		}

		const [existingRequest] = await tx
			.select()
			.from(friend_requests)
			.where(
				or(
					and(
						eq(friend_requests.sender_name, decodedUser.username),
						eq(friend_requests.receiver_name, target)
					),
					and(
						eq(friend_requests.sender_name, target),
						eq(friend_requests.receiver_name, decodedUser.username)
					)
				)
			);
		if (existingRequest) {
			throw new FoilCTF_Error('Request already exists', 403);
		}

		await tx.insert(friend_requests).values({
			sender_name: decodedUser.username,
			receiver_name: target,
		});

		res.locals.userNameToNotify = target;
		res.locals.contents = {
			title: 'New Friend Request',
			message: `${decodedUser.username} has sent a request to you`,
		};
	});
	next();
}

export async function cancelFriendRequest(
	req: Request,
	res: Response,
	_next: NextFunction
) {
	const decodedUser = res.locals.user;
	const target = req.params.username as string;

	try {
		await db
			.delete(friend_requests)
			.where(
				and(
					eq(friend_requests.sender_name, decodedUser.username),
					eq(friend_requests.receiver_name, target)
				)
			);

		return res
			.status(200)
			.json(new FoilCTF_Success('Request cancelled successfully', 200));
	} catch (err) {
		console.error(err);
		return res
			.status(500)
			.json(new FoilCTF_Error('Internal Server Error', 500));
	}
}

export async function acceptFriendRequest(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const target = req.params.username as string;
	const decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {
			const [existingRequest] = await tx
				.select()
				.from(friend_requests)
				.where(
					and(
						eq(friend_requests.sender_name, target),
						eq(friend_requests.receiver_name, decodedUser.username)
					)
				);
			if (!existingRequest) throw new FoilCTF_Error('Forbidden', 403);

			const [existingFriendship] = await tx
				.select()
				.from(friends)
				.where(
					or(
						and(
							eq(friends.username_1, target),
							eq(friends.username_2, decodedUser.username)
						),
						and(
							eq(friends.username_1, decodedUser.username),
							eq(friends.username_2, target)
						)
					)
				);
			if (existingFriendship) throw new FoilCTF_Error('Forbidden', 403);

			await tx
				.delete(friend_requests)
				.where(
					and(
						eq(friend_requests.sender_name, target),
						eq(friend_requests.receiver_name, decodedUser.username)
					)
				);
			await tx.insert(friends).values({
				username_1: decodedUser.username,
				username_2: target,
			});

			res.locals.userNameToNotify = target;
			res.locals.contents = {
				title: 'New Friend',
				message: `you can start your conversation with ${decodedUser.username}`,
			};
		});

		return next();
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.status(err.statusCode).json(err);

		console.error(err);
		return res
			.status(500)
			.json(new FoilCTF_Error('Internal Server Error', 500));
	}
}

export async function rejectFriendRequest(
	req: Request,
	res: Response,
	_next: NextFunction
) {
	const target = req.params.username as string;
	const decodedUser = res.locals.user;

	try {
		await db
			.delete(friend_requests)
			.where(
				and(
					eq(friend_requests.sender_name, target),
					eq(friend_requests.receiver_name, decodedUser.username)
				)
			);

		return res.status(200).json(new FoilCTF_Success('No Content', 200));
	} catch (err) {
		console.error(err);
		return res
			.status(500)
			.json(new FoilCTF_Error('Internal Server Error', 500));
	}
}

export async function removeFriend(
	req: Request,
	res: Response,
	_next: NextFunction
) {
	const target = req.params.username as string;
	const decodedUser = res.locals.user;

	try {
		await db
			.delete(friends)
			.where(
				or(
					and(
						eq(friends.username_1, decodedUser.username),
						eq(friends.username_2, target)
					),
					and(
						eq(friends.username_1, target),
						eq(friends.username_2, decodedUser.username)
					)
				)
			);

		return res.status(200).json(new FoilCTF_Success('Friend removed', 200));
	} catch (err) {
		console.error(err);
		return res
			.status(500)
			.json(new FoilCTF_Error('Internal Server Error', 500));
	}
}

export const notifyUser = async (
	_req: Request,
	res: Response,
	_next: NextFunction
) => {
	const username = res.locals.userNameToNotify;
	const notification = res.locals.contents;

	try {
		await db.transaction(async (tx) => {
			const [dbUser] = await tx
				.select()
				.from(users)
				.where(eq(users.username, username));
			if (!dbUser) {
				throw new FoilCTF_Error('No such user', 403);
			}

			const [insertedNotification] = await tx
				.insert(notifications)
				.values({
					contents: notification,
				})
				.returning();
			if (!insertedNotification) {
				throw new Error('Could not insert into DB');
			}

			const notificationUserRow = {
				notification_id: insertedNotification.id,
				user_id: dbUser.id,
			};
			await tx.insert(notification_users).values(notificationUserRow);

			await tx
				.update(notifications)
				.set({ is_published: true })
				.where(eq(notifications.id, insertedNotification.id));
		});

		return res.status(200).json(new FoilCTF_Success('OK', 200));
	} catch (err) {
		console.error(err);
		return res
			.status(500)
			.json(new FoilCTF_Error('Internal Server Error', 500));
	}
};
