import { NextFunction, Request, Response } from 'express';
import { friends, friendRequests, users, notifications, notificationUsers } from './db/schema';
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
			status: this.statusCode
		}
	}
}

export class FoilCTF_Success {
	public statusCode: number;
	public message: string;

	constructor(message: string, statusCode: number) {
		this.statusCode = statusCode;
		this.message = message
	}

	toJSON() {
		return {
			message: this.message,
			status: this.statusCode
		}
	}
}

export async function listFriends(req: Request, res: Response, next: NextFunction) {
    const decodedUser = res.locals.user;
    const limit = Math.max(Number(req.query.limit) || 10, 1);
	const page = Math.max(Number(req.query.page) || 1, 1);
	const search = req.query.q as string;

	const searchFilter = search
		? or(
			ilike(friends.username1, `${search}%`),
			ilike(friends.username2, `${search}%`)
		)
		: undefined;

    const dbFriends = await db
        .select()
        .from(friends)
		.where(and(
			or(
				eq(friends.username1, decodedUser.username),
				eq(friends.username2, decodedUser.username),
			),
			searchFilter
        ))
		.limit(limit)
		.offset(limit * (page - 1));

    const decodedUserFriends = dbFriends
        .map(row => row.username1 === decodedUser.username ? row.username2 : row.username1);

    return res.status(200).json({
		data: decodedUserFriends,
		limit,
		page,
	});
}

export async function listReceivedFriendRequests(req: Request, res: Response, next: NextFunction) {
    const decodedUser = res.locals.user;
    const limit = Math.max(Number(req.query.limit) || 10, 1);
	const page = Math.max(Number(req.query.page) || 1, 1);
	const search = req.query.q as string;

	const filters = [
		eq(friendRequests.receiverName, decodedUser.username),
	];
	if (search)
		filters.push(ilike(friendRequests.senderName, `${search}%`));

    const dbFriends = await db
        .select()
        .from(friendRequests)
		.where(and(...filters))
		.limit(limit)
		.offset(limit * (page - 1));

    return res.status(200).json({
		data: dbFriends,
		limit,
		page,
	});
}

export async function sendFriendRequest(req: Request, res: Response, next: NextFunction) {
    const target = req.params.username as string;
    const decodedUser = res.locals.user;

	try {
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
				.from(friendRequests)
				.where(or(
						and(
							eq(friendRequests.senderName, decodedUser.username),
							eq(friendRequests.receiverName, target)
						),
						and(
							eq(friendRequests.senderName, target),
							eq(friendRequests.receiverName, decodedUser.username)
						)
					)
				);
			if (existingRequest) {
				throw new FoilCTF_Error('Request already exists', 403);
			}
		
			await tx
				.insert(friendRequests)
				.values({
					senderName: decodedUser.username,
					receiverName: target
					});

			res.locals.userNameToNotify = target;
			res.locals.contents = { title: "New Friend Request", message: `${decodedUser.username} has sent a request to you` };
		})

		return next();
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.status(err.statusCode).json(err);

		console.error(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export async function cancelFriendRequest(req: Request, res: Response, next: NextFunction) {
    const decodedUser = res.locals.user;
	const target = req.params.username as string;

	await db
		.delete(friendRequests)
		.where(and(
			eq(friendRequests.senderName, decodedUser.username),
			eq(friendRequests.receiverName, target)
			)
		);

	return res.status(204).json();
}

export async function acceptFriendRequest(req: Request, res: Response, next: NextFunction) {
    const target = req.params.username as string;
	const decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {
			const [existingRequest] = await tx
				.select()
				.from(friendRequests)
				.where(and(
					eq(friendRequests.senderName, target),
					eq(friendRequests.receiverName, decodedUser.username)
					)
				);
			if (!existingRequest)
				throw new FoilCTF_Error('Forbidden', 403);

			const [existingFriendship] = await tx
				.select()
				.from(friends)
				.where(or(
					and(
						eq(friends.username1, target),
						eq(friends.username2, decodedUser.username)
					),
					and(
						eq(friends.username1, decodedUser.username),
						eq(friends.username2, target)
					)
				));
			if (existingFriendship)
				throw new FoilCTF_Error('Forbidden', 403);

			await tx.delete(friendRequests).where(
				and(
					eq(friendRequests.senderName, target),
					eq(friendRequests.receiverName, decodedUser.username),
				)
			);
			await tx.insert(friends).values({
                username1: decodedUser.username,
				username2: target,
			});

			res.locals.userNameToNotify = target;
			res.locals.contents = { title: "New Friend", message: `you can start your conversation with ${decodedUser.username}` };
		});

		return next();
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.status(err.statusCode).json(err);

		console.error(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export async function rejectFriendRequest(req: Request, res: Response, next: NextFunction) {
    const target = req.params.username as string;
	const decodedUser = res.locals.user;

	try {
		await db.delete(friendRequests).where(
			and(
				eq(friendRequests.senderName, target),
				eq(friendRequests.receiverName, decodedUser.username),
			)
		);

		return res.status(200).json(new FoilCTF_Success("No Content", 200));
	} catch (err) { 
		console.error(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export async function removeFriend(req: Request, res: Response, next: NextFunction) {
    const target = req.params.username as string;
	const decodedUser = res.locals.user;

	try {
		await db
			.delete(friends)
			.where(
				or(
					and(
						eq(friends.username1, decodedUser.username),
						eq(friends.username2, target)
					),
					and(
						eq(friends.username1, target),
						eq(friends.username2, decodedUser.username)
					)
				)
			);

		return res.status(204).json(new FoilCTF_Success("No Content", 204));
	} catch (err) {
		console.error(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export const notifyUser = async(req: Request, res: Response, next: NextFunction) => {
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
					contents: notification
				})
				.returning();
			if (!insertedNotification) {
				throw new Error('Could not insert into DB');
			}

			const notificationUserRow = {
				notificationId: insertedNotification.id,
				userId: dbUser.id
			}
			await tx
				.insert(notificationUsers)
				.values(notificationUserRow);

			await tx
				.update(notifications)
				.set({ isPublished: true})
				.where(eq(notifications.id, insertedNotification.id));
		});

		return res.status(200).json(new FoilCTF_Success("OK", 200));
	} catch (err) {
		console.error(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
}
