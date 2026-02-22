import { NextFunction, Request, Response } from 'express';
import { db } from './utils/db';
import { eq, and, sql, ne, ilike } from 'drizzle-orm';
import { users, teams, team_members, team_join_requests, notifications, notification_users } from './db/schema';
import { FoilCTF_Error, FoilCTF_Success } from './utils/types';

export const createTeam = async(req: Request, res: Response) => {
	const decodedUser = res.locals.user;
	const {newTeamName, max_members} = req.body;

	try {
		await db.transaction(async (tx) => {
			
			const [dbUser] = await tx
						.select()
						.from(users)
						.where(eq(users.id, decodedUser.id));
				if (!dbUser || dbUser.team_name) {
					throw new FoilCTF_Error('Forbidden', 403);
				}
			
				const [existingTeam] = await tx						.select()
						.from(teams)						.where(eq(teams.name, newTeamName));
			if (existingTeam) {
				throw new FoilCTF_Error('Name Already Used', 409);
			}

			await tx
				.insert(teams)
				.values({
				name: newTeamName,
				captain_name: decodedUser.username,
				max_members: max_members
				});

			await tx.insert(team_members).values({
				team_name: newTeamName,
				member_name: decodedUser.username,
			});
			await tx.update(users).set({ team_name: newTeamName }).where(eq(users.id, decodedUser.id));
		});

		return res.status(201).json(new FoilCTF_Success("Created", 201));
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.status(err.statusCode).json(err);
		console.error(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export const getTeamDetails = async(req: Request, res: Response) => {
	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.name, req.params.teamName as string))

	if (!team)
		return res.status(404).json(new FoilCTF_Error('Not Found', 404));

	const { name, captain_name, members_count, description, is_locked, max_members } = team;
	return res.status(200).json({
		name,
		captain_name,
		members_count,
		max_members,
		description,
		is_locked,
	});
}

export const getTeamMembers = async(req: Request, res: Response) => {
	const limit = Math.max(Number(req.query.limit) || 10, 1);
	const page = Math.max(Number(req.query.page) || 1, 1);
	const search = req.query.q as string;

	const filters = [
		eq(team_members.team_name, req.params.teamName as string)
	];
	if (search)
		filters.push(ilike(team_members.member_name, `${search}%`));

	const	members = await db
				.select()
				.from(team_members)
				.where(and(...filters))
				.limit(limit)
				.offset(limit * (page - 1));

	// if (!members || members.length === 0)
	// 	return res.status(404).json(new FoilCTF_Error('Not Found', 404));

	const	membersNames = members.map( ({ member_name }) => member_name );
	return res.status(200).json({
		data: membersNames,
		page,
		limit,
	});
}

export const leaveTeam = async(req: Request, res: Response, next: NextFunction) => {
	const	decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {

			const	[team] = await tx
						.select()
						.from(teams)
						.where(eq(teams.name, req.params.teamName as string));
			if (!team) {
					throw new FoilCTF_Error('Not Found', 404);
				}

				const [membership] = await tx
						.select()
						.from(team_members)
						.where(and(
							eq(team_members.team_name, team.name),
							eq(team_members.member_name, decodedUser.username)
						));
				if (!membership) {
					throw new FoilCTF_Error('Forbidden', 403);
				}

				if (team.captain_name === decodedUser.username && team.members_count != 1) {
					throw new FoilCTF_Error('Forbidden', 403);
				}

				await tx.delete(team_members).where(and(
					eq(team_members.team_name, team.name),
					eq(team_members.member_name, decodedUser.username)
				));
				const [updatedTeam] = await tx
					.update(teams)
					.set({ members_count: sql`${teams.members_count} - 1` })
					.where(eq(teams.name, team.name))
					.returning();
				if (!updatedTeam)
					throw new Error('Could not update DB');
			await tx.update(users).set({ team_name: null }).where(eq(users.username, decodedUser.username));
			if (updatedTeam.members_count === 0) { // last member of the team
				await tx.delete(team_join_requests).where(eq(team_join_requests.team_name, team.name));
				await tx.delete(teams).where(eq(teams.id, team.id));
			}

			res.locals.teamName = team.name;
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
	const targetUsername = req.params.username as string;
	const targetTeamName = req.params.teamName as string;
	const decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {
			const	[team] = await tx
						.select()
						.from(teams)
						.where(eq(teams.captain_name, decodedUser.username));
			if (!team || targetTeamName !== team.name) {
				throw new FoilCTF_Error('Forbidden', 403);
			}
		
			const [DBrequstedMember] = await tx.
				select()
				.from(team_members)
				.where(and(
					eq(team_members.team_name, targetTeamName),
					eq(team_members.member_name, targetUsername)
			));
			if (!DBrequstedMember || DBrequstedMember.team_name !== team.name) {
				throw new FoilCTF_Error('Forbidden', 403);
			}
		
			if (targetUsername === decodedUser.username) {
				throw new FoilCTF_Error('Forbidden', 403);
			}

			await tx.delete(team_members).where(and(
					eq(team_members.team_name, targetTeamName),
					eq(team_members.member_name, targetUsername)
				));
				await tx.update(teams).set({ members_count: sql`${teams.members_count} - 1` }).where(eq(teams.name, team.name));
				await tx.update(users).set({ team_name: null }).where(eq(users.username, targetUsername));

				res.locals.teamName = team.name;
				res.locals.contents = { title: "Member Has Been Deleted", message: `${targetUsername} has been deleted` };
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

export const handOverLeadership = async(req: Request, res: Response, next: NextFunction) => {
	const targetUsername = req.body.username;
	const decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {
			const	[team] = await tx
						.select()
						.from(teams)
						.where(eq(teams.captain_name, decodedUser.username));
			if (!team) {
				throw new FoilCTF_Error('Forbidden', 403);
			}
		
			const [member] = await tx
						.select()
						.from(team_members)
						.where(and(
							eq(team_members.member_name, targetUsername),
							eq(team_members.team_name, team.name),
							));
			if (!member) {
				throw new FoilCTF_Error('Forbidden', 403);
			}
		
			await tx.update(teams).set({ captain_name: targetUsername }).where(eq(teams.name, team.name));
		
			res.locals.captain_name = member.member_name; // new captain
			res.locals.team_name = team.name;
			res.locals.contents = { title: "New Captain", message: `${decodedUser.username} made you the captain of the team` };
		});

		return next();
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.status(err.statusCode).json(err);
		console.error(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export const sendJoinRequest = async(req: Request, res: Response, next: NextFunction) => {
	const targetTeam_name = req.params.team_name as string;
	const decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {
			const [dbUser] = await tx
						.select()
						.from(users)
						.where(eq(users.id, decodedUser.id));
			if (!dbUser || dbUser.team_name) {
				throw new FoilCTF_Error('Forbidden', 403);
			}

			const	[team] = await tx
						.select()
						.from(teams)
						.where(eq(teams.name, targetTeam_name));
			if (!team) {
				throw new FoilCTF_Error('Not Found', 404);
			}
			if (team.is_locked === true || team.members_count >= team.max_members) {
				throw new FoilCTF_Error('Team is locked', 403);
			}

			const existingRequests = await tx
				.select()
				.from(team_join_requests)
				.where(and(
					eq(team_join_requests.username, decodedUser.username),
					eq(team_join_requests.team_name, team.name)
				));
			if (existingRequests.length > 0) {
				throw new FoilCTF_Error('Already sent a request', 403);
			}

			await tx
				.insert(team_join_requests)
				.values({
					team_name: targetTeam_name,
					username: decodedUser.username
					});

			res.locals.captain_name = team.captain_name;
			res.locals.team_name = team.name;
			res.locals.contents = { title: "New Join Request", message: `${decodedUser.username} sent a join request` };
		});
	
		return next();
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.status(err.statusCode).json(err);
		console.error(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export const cancelJoinRequest = async(req: Request, res: Response, _next: NextFunction) => {
	const decodedUser = res.locals.user;

	await db
		.delete(team_join_requests)
		.where(and(
			eq(team_join_requests.username, decodedUser.username),
			eq(team_join_requests.team_name, req.params.team_name as string)
			)
		);

	return res.status(204).json(new FoilCTF_Success("No Content", 204));
}

export const acceptJoinRequest = async(req: Request, res: Response, next: NextFunction) => {
	const targetTeam_name = req.params.team_name as string;
	const targetUsername = req.params.username as string;
	const decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {
			const [dbUser] = await tx
						.select()
						.from(users)
						.where(eq(users.username, targetUsername));
			if (!dbUser || dbUser.team_name) {
				throw new FoilCTF_Error('Forbidden', 403);
			}
		
			const	[team] = await tx
						.select()
						.from(teams)
						.where(eq(teams.captain_name, decodedUser.username));
			if (  !team
				|| team.name !== targetTeam_name
				|| team.is_locked === true
				|| team.members_count >= team.max_members
				) {
				throw new FoilCTF_Error('Forbidden', 403);
			}

			const [teamJoinRequest] = await tx
						.select()
						.from(team_join_requests)
						.where(and(
							eq(team_join_requests.username, targetUsername),
							eq(team_join_requests.team_name, targetTeam_name),
							));
			if (!teamJoinRequest) {
				throw new FoilCTF_Error('Not Found', 404);
			}

			await tx.delete(team_join_requests).where(
					eq(team_join_requests.username, targetUsername), // delete all requests from that user after being accepted to a team
			);
			await tx.insert(team_members).values({
							member_name: targetUsername,
							team_name: targetTeam_name,
							});
			await tx.update(teams).set({ members_count: sql`${teams.members_count} + 1` }).where(eq(teams.name, team.name));
			await tx.update(users).set({ team_name: team.name }).where(eq(users.username, targetUsername));

			res.locals.team_name = team.name;
			res.locals.contents = { title: "new member!", message: `${teamJoinRequest.username} joined the team` };
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

export const declineJoinRequest = async(req: Request, res: Response, _next: NextFunction) => {
	const targetTeam_name = req.params.team_name as string;
	const targetUsername = req.params.username as string;
	const decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {
			const [team] = await tx
						.select()
						.from(teams)
						.where(eq(teams.captain_name, decodedUser.username));
			if (!team || targetTeam_name !== team.name ) {
				throw new FoilCTF_Error('Forbidden', 403);
			}
			await tx.delete(team_join_requests).where(
				and(
					eq(team_join_requests.team_name, targetTeam_name),
					eq(team_join_requests.username, targetUsername)
					)
			);
		});
		return res.status(204).json(new FoilCTF_Success("No Content", 204));
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.status(err.statusCode).json(err);
		console.error(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export const getSentRequests = async(req: Request, res: Response, _next: NextFunction) => {
	const limit = Math.max(Number(req.query.limit) || 10, 1);
	const page = Math.max(Number(req.query.page) || 1, 1);
	const search = req.query.q as string;
	const decodedUser = res.locals.user;

	const filters = [
		eq(team_join_requests.username, decodedUser.username)
	];
	if (search)
		filters.push(ilike(team_join_requests.team_name, `${search}%`));

	const dbRequests = await db
		.select()
		.from(team_join_requests)
		.where(and(...filters))
		.limit(limit)
		.offset(limit * (page - 1));

	const sentRequests = dbRequests.map( ({ team_name }) => team_name );

	return res.status(200).json({
		data: sentRequests,
		page,
		limit,
	});
}

export const notifyCaptain = async(_req: Request, res: Response, _next: NextFunction) => {
	const captain_name = res.locals?.captain_name;
	const contents = res.locals.contents;

	try {
		await db.transaction(async (tx) => {
			const [captainUser] = await tx
				.select()
				.from(users)
				.where(eq(users.username, captain_name));
			if (!captainUser) {
				throw new FoilCTF_Error('Forbidden', 403);
			}

			const [insertedNotification] = await tx
				.insert(notifications)
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
				.insert(notification_users)
				.values(notificationUserRow); // TODO(xenobas): Continue the work on camelCase -> snake_case
			await tx
				.update(notifications)
				.set({ is_published: true})
				.where(eq(notifications.id, insertedNotification.id));
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
				.from(users)
				.where(
					and(
						eq(users.team_name, team_name),
						ne(users.username, exception),
					)
				);
			if (membersToNotify.length === 0) {
				throw new FoilCTF_Success('OK', 200);
			}

			const [insertedNotification] = await tx
				.insert(notifications)
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
				.insert(notification_users)
				.values(notification_user_rows);
			await tx
				.update(notifications)
				.set({ is_published: true})
				.where(eq(notifications.id, insertedNotification.id));
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
	const {is_locked, description, max_members} = req.body;

	try {
		await db.transaction(async (tx) => {
			const [team] = await tx
				.select()
				.from(teams)
				.where(eq(teams.captain_name, decodedUser.username));
			if (!team) {
				throw new FoilCTF_Error('Forbidden', 403);
			}

			if (is_locked !== undefined || description !== undefined || max_members !== undefined) {
				await tx
				.update(teams)
				.set({
					is_locked: is_locked,
					description: description,
					max_members: max_members,
				})
				.where(eq(teams.name, team.name));
			}

			return res.status(200).json(new FoilCTF_Success("Created", 200));
		});
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.status(err.statusCode).json(err);
		console.error(err);
		return res.status(500).json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export const getTeams = async(req: Request, res: Response) => {
	const limit = Number(req.query.limit) || 10;
	const page = Number(req.query.page) || 1;
	const search = req.query.q as string; // filter just as other gets?

	const dbTeams = await db
		.select()
		.from(teams)
		.where(search ? ilike(teams.name, `${search}%`) : undefined)
		.limit(limit)
		.offset(limit * (page - 1));

	const dbTeamsPublicData = dbTeams.map( (team) => ({
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

export const getReceivedRequests = async(req: Request, res: Response) => {
	const decodedUser = res.locals.user;
	const limit = Math.max(Number(req.query.limit) || 10, 1);
	const page = Math.max(Number(req.query.page) || 1, 1);
	const search = req.query.q as string;

	const [team] = await db
		.select()
		.from(teams)
		.where(eq(teams.captain_name, decodedUser.username));
	if (!team) {
		return res.status(403).json(new FoilCTF_Error('Forbidden', 403))
	}

	const filters = [
		eq(team_join_requests.team_name, team.name)
	];
	if (search)
		filters.push(ilike(team_join_requests.username, `${search}%`));

	const dbRequests = await db
		.select()
		.from(team_join_requests)
		.where(and(...filters))
		.limit(limit)
		.offset(limit * (page - 1));
	const receivedRequests = dbRequests.map( ({ username }) => username );
	return res.status(200).json({
		data: receivedRequests,
		page,
		limit,
	});
}
