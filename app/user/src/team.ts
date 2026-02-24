import { eq, and, sql, ne, ilike } from 'drizzle-orm';
import { NextFunction, Request, Response } from 'express';

import { db } from './utils/db';
import { JWT_Payload } from './jwt';
import { FoilCTF_Error, FoilCTF_Success } from './utils/types';
import { users as table_users, profiles as table_profiles, teams as table_teams, team_members as table_team_members, team_join_requests as table_team_join_requests, notifications as table_notifications, notification_users as table_notification_users } from './db/schema';

export const createTeam = async(req: Request, res: Response<any, { user: JWT_Payload }>) => {
	const { name } = req.body;
	const captain_user = res.locals.user;

	await db.transaction(async (tx) => {
		const [dbUser] = await tx
			.select()
			.from(table_users)
			.where(eq(table_users.id, captain_user.id));
		if (!dbUser)
			throw new FoilCTF_Error('Forbidden', 403);
		if (dbUser.team_name)
			throw new FoilCTF_Error('User is already in a team', 403);
		
		const [existingTeam] = await tx.select()
			.from(table_teams)
			.where(eq(table_teams.name, name));
		if (existingTeam)
			throw new FoilCTF_Error('Team name already used', 409);

		await tx.insert(table_teams).values({ name, captain_name: captain_user.username });
		await tx.insert(table_team_members).values({ team_name: name, member_name: captain_user.username });
		await tx.update(table_users).set({ team_name: name }).where(eq(table_users.id, captain_user.id));
	});
	return res.status(201).json(new FoilCTF_Success("Created", 201));
}

export const getTeamDetails = async(req: Request, res: Response) => {
	const [team] = await db
				.select({
					name: table_teams.name,
					captain_name: table_teams.captain_name,
					members_count: table_teams.members_count,
					description: table_teams.description,
					is_locked: table_teams.is_locked,
				})
				.from(table_teams)
				.where(eq(table_teams.name, req.params.team_name as string))
	if (!team)
		return res.status(404).json(new FoilCTF_Error('Not Found', 404)).end();
	return res.status(200).json(team).end();
}

export const getTeamMembers = async(req: Request, res: Response) => {
	const members = await db
				.select({
					id: table_users.id,
					username: table_team_members.member_name,

					avatar: table_profiles.avatar,
					total_points: table_profiles.totalpoints,
					challenges_solved: table_profiles.challengessolved,
				})
				.from(table_team_members)
				.leftJoin(table_users, eq(table_users.username, table_team_members.member_name))
				.leftJoin(table_profiles, eq(table_profiles.username, table_team_members.member_name))
				.where(eq(table_team_members.team_name, req.params.team_name as string));
	return res.status(200).json({ members }).end();
}

export const leaveTeam = async(req: Request, res: Response, next: NextFunction) => {
	const	decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {

			const	[team] = await tx
						.select()
						.from(table_teams)
						.where(eq(table_teams.name, req.params.team_name as string));
			if (!team) {
					throw new FoilCTF_Error('Not Found', 404);
				}

				const [membership] = await tx
						.select()
						.from(table_team_members)
						.where(and(
							eq(table_team_members.team_name, team.name),
							eq(table_team_members.member_name, decodedUser.username)
						));
				if (!membership) {
					throw new FoilCTF_Error('Forbidden', 403);
				}

				if (team.captain_name === decodedUser.username && team.members_count != 1) {
					throw new FoilCTF_Error('Forbidden', 403);
				}

				await tx.delete(table_team_members).where(and(
					eq(table_team_members.team_name, team.name),
					eq(table_team_members.member_name, decodedUser.username)
				));
				const [updatedTeam] = await tx
					.update(table_teams)
					.set({ members_count: sql`${table_teams.members_count} - 1` })
					.where(eq(table_teams.name, team.name))
					.returning();
				if (!updatedTeam)
					throw new Error('Could not update DB');
			await tx.update(table_users).set({ team_name: null }).where(eq(table_users.username, decodedUser.username));
			if (updatedTeam.members_count === 0) { // last member of the team
				await tx.delete(table_team_join_requests).where(eq(table_team_join_requests.team_name, team.name));
				await tx.delete(table_teams).where(eq(table_teams.id, team.id));
			}

			res.locals.team_name = team.name;
			res.locals.contents = { title: "Member Left Team", message: `${decodedUser.username} has left the team` };
			res.locals.exception = decodedUser.username;
		});

		return next();
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.status(err.statusCode).json(err);
		console.error(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export const deleteMember = async(req: Request, res: Response, next: NextFunction) => {
	const target_username = req.params.username as string;
	const target_team_name = req.params.team_name as string;
	const captain_user = res.locals.user;

	await db.transaction(async (tx) => {
		const [team] = await tx
					.select()
					.from(table_teams)
					.where(eq(table_teams.captain_name, captain_user.username));
		if (!team || target_team_name !== team.name) {
			throw new FoilCTF_Error('Forbidden', 403);
		}
	
		const [DBrequstedMember] = await tx.
			select()
			.from(table_team_members)
			.where(and(
				eq(table_team_members.team_name, target_team_name),
				eq(table_team_members.member_name, target_username)
			));
		if (!DBrequstedMember || DBrequstedMember.team_name !== team.name) {
			throw new FoilCTF_Error('Forbidden', 403);
		}
	
		if (target_username === captain_user.username) {
			throw new FoilCTF_Error('Forbidden', 403);
		}

		await tx.delete(table_team_members).where(and(
			eq(table_team_members.team_name, target_team_name),
			eq(table_team_members.member_name, target_username)
		));
		await tx.update(table_teams).set({ members_count: sql`${table_teams.members_count} - 1` }).where(eq(table_teams.name, team.name));
		await tx.update(table_users).set({ team_name: null }).where(eq(table_users.username, target_username));

		res.locals.team_name = team.name;
		res.locals.contents = { title: "Member Has Been Deleted", message: `${target_username} has been deleted` };
		res.locals.exception = captain_user.username;
	});
	next();
}

export const handOverLeadership = async(req: Request, res: Response, next: NextFunction) => {
	const target_username = req.body.username;
	const captain_user = res.locals.user;

	await db.transaction(async (tx) => {
		const [team] = await tx
					.select()
					.from(table_teams)
					.where(eq(table_teams.captain_name, captain_user.username));
		if (!team) {
			throw new FoilCTF_Error('Forbidden', 403);
		}
	
		const [member] = await tx
					.select()
					.from(table_team_members)
					.where(and(
						eq(table_team_members.member_name, target_username),
						eq(table_team_members.team_name, team.name),
						));
		if (!member)
			throw new FoilCTF_Error('Forbidden', 403);
	
		await tx.update(table_teams).set({ captain_name: target_username }).where(eq(table_teams.name, team.name));
	
		res.locals.captain_name = member.member_name; // new captain
		res.locals.team_name = team.name;
		res.locals.contents = { title: "New Captain", message: `${captain_user.username} made you the captain of the team` };
	});
	next();
}

export const sendJoinRequest = async(req: Request, res: Response, next: NextFunction) => {
	const target_team_name = req.params.team_name as string;
	const jwt_user = res.locals.user;

	await db.transaction(async (tx) => {
		const [request_user] = await tx
					.select()
					.from(table_users)
					.where(eq(table_users.id, jwt_user.id));
		if (!request_user || request_user.team_name) {
			throw new FoilCTF_Error('Forbidden', 403);
		}

		const [request_team] = await tx
					.select()
					.from(table_teams)
					.where(eq(table_teams.name, target_team_name));
		if (!request_team)
			throw new FoilCTF_Error('Not Found', 404);
		if (request_team.is_locked === true)
			throw new FoilCTF_Error('Team is locked', 403);

		const old_requests = await tx
			.select()
			.from(table_team_join_requests)
			.where(and(
				eq(table_team_join_requests.username, jwt_user.username),
				eq(table_team_join_requests.team_name, request_team.name)
			));
		if (old_requests.length > 0)
			throw new FoilCTF_Error('Already sent a request', 403);

		await tx
			.insert(table_team_join_requests)
			.values({
				team_name: target_team_name,
				username: jwt_user.username
			});

		res.locals.captain_name = request_team.captain_name;
		res.locals.team_name = request_team.name;
		res.locals.contents = { title: "New Join Request", message: `${jwt_user.username} sent a join request` };
	});
	next();
}

export const cancelJoinRequest = async(req: Request, res: Response<any, { user: JWT_Payload }>) => {
	const { user } = res.locals;
	const { team_name } = req.params;
	if (typeof team_name !== 'string' || !team_name)
		return res.status(404).json(new FoilCTF_Error('Invalid team name', 404)).end();

	await db
		.delete(table_team_join_requests)
		.where(
			and(
				eq(table_team_join_requests.username, user.username),
				eq(table_team_join_requests.team_name, team_name),
			)
		);
	return res.status(200).json({ ok: true }).end();
}

export const acceptJoinRequest = async(req: Request, res: Response, next: NextFunction) => {
	const target_team_name = req.params.team_name as string;
	const target_username = req.params.username as string;
	const captain_user = res.locals.user;

	await db.transaction(async (tx) => {
		const [dbUser] = await tx
					.select()
					.from(table_users)
					.where(eq(table_users.username, target_username));
		if (!dbUser || dbUser.team_name) {
			throw new FoilCTF_Error('Forbidden', 403);
		}
	
		const	[team] = await tx
					.select()
					.from(table_teams)
					.where(eq(table_teams.captain_name, captain_user.username));
		if (   !team
			|| team.name !== target_team_name
			|| team.is_locked
			) {
			throw new FoilCTF_Error('Forbidden', 403);
		}

		const [teamJoinRequest] = await tx
					.select()
					.from(table_team_join_requests)
					.where(and(
						eq(table_team_join_requests.username, target_username),
						eq(table_team_join_requests.team_name, target_team_name),
						));
		if (!teamJoinRequest) {
			throw new FoilCTF_Error('Not Found', 404);
		}

		await tx.delete(table_team_join_requests).where(
				eq(table_team_join_requests.username, target_username), // delete all requests from that user after being accepted to a team
		);
		await tx.insert(table_team_members).values({
						member_name: target_username,
						team_name: target_team_name,
						});
		await tx.update(table_teams).set({ members_count: sql`${table_teams.members_count} + 1` }).where(eq(table_teams.name, team.name));
		await tx.update(table_users).set({ team_name: team.name }).where(eq(table_users.username, target_username));

		res.locals.team_name = team.name;
		res.locals.contents = { title: "new member!", message: `${teamJoinRequest.username} joined the team` };
		res.locals.exception = captain_user.username;
	});
	next();
}

export const declineJoinRequest = async(req: Request, res: Response, _next: NextFunction) => {
	const target_team_name = req.params.team_name as string;
	const target_username = req.params.username as string;
	const captain_user = res.locals.user;

	await db.transaction(async (tx) => {
		const [team] = await tx
					.select()
					.from(table_teams)
					.where(eq(table_teams.captain_name, captain_user.username));
		if (!team || target_team_name !== team.name ) {
			throw new FoilCTF_Error('Forbidden', 403);
		}
		await tx.delete(table_team_join_requests).where(
			and(
				eq(table_team_join_requests.team_name, target_team_name),
				eq(table_team_join_requests.username, target_username)
				)
		);
	});
	return res.status(200).json({ ok: true }).end();
}

export const notifyCaptain = async(_req: Request, res: Response, _next: NextFunction) => {
	const captain_name = res.locals?.captain_name;
	const contents = res.locals.contents;

	try {
		await db.transaction(async (tx) => {
			const [captainUser] = await tx
				.select()
				.from(table_users)
				.where(eq(table_users.username, captain_name));
			if (!captainUser) {
				throw new FoilCTF_Error('Forbidden', 403);
			}

			const [insertedNotification] = await tx
				.insert(table_notifications)
				.values({
					contents: contents
				})
				.returning();
			if (!insertedNotification) {
				throw new Error('Could not insert into DB');
			}

			const notificationUserRow = {
				notification_id: insertedNotification.id,
				user_id: captainUser.id
			}

			await tx
				.insert(table_notification_users)
				.values(notificationUserRow); // TODO(xenobas): Continue the work on camelCase -> snake_case
			await tx
				.update(table_notifications)
				.set({ is_published: true})
				.where(eq(table_notifications.id, insertedNotification.id));
		});

		return res.status(200).json(new FoilCTF_Success("OK", 200));
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.status(err.statusCode).json(err);
		console.error(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export const notifyAllMembers = async(_req: Request, res: Response, _next: NextFunction) => {
	const team_name = res.locals.team_name;
	const exception = res.locals.exception;
	const contents = res.locals.contents

	try {
		await db.transaction(async (tx) => {
			const membersToNotify = await tx
				.select()
				.from(table_users)
				.where(
					and(
						eq(table_users.team_name, team_name),
						ne(table_users.username, exception),
					)
				);
			if (membersToNotify.length === 0) {
				throw new FoilCTF_Success('OK', 200);
			}

			const [insertedNotification] = await tx
				.insert(table_notifications)
				.values({
					contents: contents
				})
				.returning();
			if (!insertedNotification) {
				throw new Error('Could not insert into DB');
			}

			const notification_user_rows = membersToNotify.map( (user) => ({
				notification_id: insertedNotification.id,
				user_id: user.id
			}));
			
			await tx
				.insert(table_notification_users)
				.values(notification_user_rows);
			await tx
				.update(table_notifications)
				.set({ is_published: true})
				.where(eq(table_notifications.id, insertedNotification.id));
		});

		return res.status(200).json(new FoilCTF_Success("OK", 200));
	} catch (err) {
		if (err instanceof FoilCTF_Error || err instanceof FoilCTF_Success)
			return res.status(err.statusCode).json(err);
		console.error(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export const updateTeam = async(req: Request, res: Response, _next: NextFunction) => {
	const decodedUser = res.locals.user;
	const {is_locked, description} = req.body;

	await db.transaction(async (tx) => {
		const [team] = await tx
			.select()
			.from(table_teams)
			.where(eq(table_teams.captain_name, decodedUser.username));
		if (!team) {
			throw new FoilCTF_Error('Forbidden', 403);
		}

		if (is_locked !== undefined || description !== undefined) {
			await tx
			.update(table_teams)
			.set({
				is_locked: is_locked,
				description: description,
			})
			.where(eq(table_teams.name, team.name));
		}

		return res.status(200).json(new FoilCTF_Success("Created", 200));
	});
}

export const getTeams = async(req: Request, res: Response) => {
	const limit = Number(req.query.limit) || 10;
	const page = Number(req.query.page) || 1;
	const search = req.query.q as string; // filter just as other gets?

	const dbTeams = await db
		.select()
		.from(table_teams)
		.where(search ? ilike(table_teams.name, `%${search}%`) : undefined)
		.limit(limit)
		.offset(limit * (page - 1));

	const dbTeamsPublicData = dbTeams.map(team => ({
		id: team.id,
		name: team.name,
		captain_name: team.captain_name,
		members_count: team.members_count,
		description: team.description,
		is_locked: team.is_locked,
	}));

	return res.status(200).json({
		data: dbTeamsPublicData,
		page,
		limit,
	});
}

export const route_team_delete = async(req: Request, res: Response<any, { user: JWT_Payload }>) => {
	const captain_user = res.locals.user;
	const team_name = req.params.team_name;
	if (typeof team_name !== 'string' || !team_name)
		throw new FoilCTF_Error('Team not found', 404);

	const where_team_conditions = [
		eq(table_teams.captain_name, captain_user.username),
		eq(table_teams.name, team_name),
	];
	await db.transaction(async (tx) => {
		const [team] = await tx
			.select()
			.from(table_teams)
			.where(and(...where_team_conditions))
			.limit(1);
		if (!team)
			throw new FoilCTF_Error('Must be a captain to delete a team', 403);

		const members_data = await tx
			.select({ id: table_users.id })
			.from(table_team_members)
			.leftJoin(table_users, eq(table_users.username, table_team_members.member_name))
			.where(eq(table_team_members.team_name, team_name));
		const members = members_data.map(x => x.id).filter(x => x !== null);

		await tx // NOTE(xenobas): Delete all requests to join the team
			.delete(table_team_join_requests)
			.where(eq(table_team_join_requests.team_name, team.name));
		await tx // NOTE(xenobas): Delete all members in the team
			.delete(table_team_members)
			.where(eq(table_team_members.team_name, team.name));
		await tx // NOTE(xenobas): Delete the team itself
			.delete(table_teams)
			.where(eq(table_teams.name, team.name));

		// NOTE(xenobas): Notify all members of what happened
		const [notification] = await tx
			.insert(table_notifications)
			.values({
				contents: `Team ${team.name} has been deleted`
			})
			.returning();
		if (!notification)
			throw new FoilCTF_Error('Internal Server Error', 500);

		const notification_user_rows = members.map( (user_id) => ({
			user_id,
			notification_id: notification.id,
		}));
		
		await tx
			.insert(table_notification_users)
			.values(notification_user_rows);
		await tx
			.update(table_notifications)
			.set({ is_published: true})
			.where(eq(table_notifications.id, notification.id));
	});

	res.status(200).json({ ok: true }).end();
}

export const route_team_requests = async(req: Request, res: Response) => {
	const decodedUser = res.locals.user;
	const limit = Math.max(Number(req.query.limit) || 10, 1);
	const page = Math.max(Number(req.query.page) || 1, 1);
	const search = req.query.q as string;

	const [team] = await db
		.select({ id: table_teams.id, name: table_teams.name })
		.from(table_teams)
		.where(eq(table_teams.captain_name, decodedUser.username));
	if (!team)
		return res.status(403).json(new FoilCTF_Error('Forbidden', 403))

	const where_and_conditions = [eq(table_team_join_requests.team_name, team.name)];
	if (search)
		where_and_conditions.push(ilike(table_team_join_requests.username, `%${search}%`));

	const requests = await db
		.select()
		.from(table_team_join_requests)
		.where(and(...where_and_conditions))
		.limit(limit)
		.offset(limit * (page - 1));
	return res.status(200).json({
		data: requests.map(({ username }) => username),
		page,
		limit,
	});
}
