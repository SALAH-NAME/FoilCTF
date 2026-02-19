import { NextFunction, Request, Response } from 'express';
import { db } from './utils/db';
import { eq, and, sql, ne, ilike } from 'drizzle-orm';
import { users, teams, teamMembers, teamJoinRequests, notifications, notificationUsers } from './db/schema';
import { FoilCTF_Error, FoilCTF_Success } from './utils/types';

export const createTeam = async(req: Request, res: Response) => {
	const decodedUser = res.locals.user;
	const {newTeamName, maxMembers} = req.body;

	try {
		await db.transaction(async (tx) => {
			
			const [dbUser] = await db
						.select()
						.from(users)
						.where(eq(users.id, decodedUser.id));
			if (!dbUser || dbUser.teamName) {
				throw new FoilCTF_Error('Forbidden', 403);
			}
		
			const [existingTeam] = await db
						.select()
						.from(teams)
						.where(eq(teams.name, newTeamName));
			if (existingTeam) {
				throw new FoilCTF_Error('Name Already Used', 409);
			}

			await tx
				.insert(teams)
				.values({
				name: newTeamName,
				captainName: decodedUser.username,
				maxMembers: maxMembers
				});

			await tx.insert(teamMembers).values({
				teamName: newTeamName,
				memberName: decodedUser.username,
			});
			await tx.update(users).set({ teamName: newTeamName }).where(eq(users.id, decodedUser.id));
		});

		return res.json(new FoilCTF_Success("Created", 201));
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.json(err);
		console.error(err);
		return res.json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export const getTeamDetails = async(req: Request, res: Response) => {
	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.name, req.params.teamName as string))

	if (!team)
		return res.json(new FoilCTF_Error('Not Found', 404));

	const {name, captainName, membersCount, description, isLocked, maxMembers, ...privateInfos} = team;

	return res.json({
			name: name,
			captainName: captainName,
			membersCount: membersCount,
			maxMembers: maxMembers,
			description: description,
			isLocked: isLocked,
			});
}

export const getTeamMembers = async(req: Request, res: Response) => {
	const limit = Math.max(Number(req.query.limit) || 10, 1);
	const page = Math.max(Number(req.query.page) || 1, 1);
	const search = req.query.q as string;

	const filters = [
		eq(teamMembers.teamName, req.params.teamName as string)
	];
	if (search)
		filters.push(ilike(teamMembers.memberName, `${search}%`));

	const	members = await db
				.select()
				.from(teamMembers)
				.where(and(...filters))
				.limit(limit)
				.offset(limit * (page - 1));

	if (!members || members.length === 0)
		return res.json(new FoilCTF_Error('Not Found', 404));

	const	membersNames = members.map( ({ memberName }) => memberName );

	return res.json({
		data: membersNames,
		page,
		limit,
	});
}

export const leaveTeam = async(req: Request, res: Response, next: NextFunction) => { // data race?
	const	decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {

			const	[team] = await tx
						.select()
						.from(teams)
						.where(eq(teams.name, req.params.teamName as string));
			if (!team) {
				throw new FoilCTF_Error('Forbidden', 403);
			}
			if (team.captainName === decodedUser.username && team.membersCount != 1) {
				throw new FoilCTF_Error('Forbidden', 403);
			}

			await tx.delete(teamMembers).where(eq(teamMembers.memberName, decodedUser.username));

			const [updatedTeam] = await tx.update(teams).set({ membersCount: sql`${teams.membersCount} - 1` }).where(eq(teams.name, team.name)).returning();
			if (!updatedTeam)
				throw new Error('Could not insert into DB');

			await tx.update(users).set({ teamName: null }).where(eq(users.username, decodedUser.username));
			if (updatedTeam.membersCount === 0) { // last member of the team
				await tx.delete(teamJoinRequests).where(eq(teamJoinRequests.teamName, team.name));
				await tx.delete(teams).where(eq(teams.id, team.id));
			}

			res.locals.teamName = team.name;
			res.locals.contents = { title: "", message: `${decodedUser.username} has left the team` };
			res.locals.exception = decodedUser.username;
		});

		return next();
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.json(err);
		console.error(err);
		return res.json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export const deleteMember = async(req: Request, res: Response, next: NextFunction) => { // data race?
	const targetUsername = req.params.username as string;
	const targetTeamName = req.params.teamName as string;
	const decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {
			const	[team] = await tx
						.select()
						.from(teams)
						.where(eq(teams.captainName, decodedUser.username));
			if (!team || targetTeamName !== team.name) {
				throw new FoilCTF_Error('Forbidden', 403);
			}
		
			const [DBrequstedMember] = await tx.
				select()
				.from(teamMembers)
				.where(and(
					eq(teamMembers.teamName, targetTeamName),
					eq(teamMembers.memberName, targetUsername)
			));
			if (!DBrequstedMember || DBrequstedMember.teamName !== team.name) {
				throw new FoilCTF_Error('Forbidden', 403);
			}
		
			if (targetUsername === decodedUser.username) {
				throw new FoilCTF_Error('Forbidden', 403);
			}

			await tx.delete(teamMembers).where(eq(teamMembers.memberName, targetUsername));
			await tx.update(teams).set({ membersCount: sql`${teams.membersCount} - 1` }).where(eq(teams.name, team.name));
			await tx.update(users).set({ teamName: null }).where(eq(users.username, targetUsername));

			res.locals.teamName = team.name;
			res.locals.contents = { title: "", message: `${decodedUser.username} has been deleted` };
			res.locals.exception = decodedUser.username;
		});

		return next();
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.json(err);
		console.error(err);
		return res.json(new FoilCTF_Error("Internal Server Error", 500));
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
						.where(eq(teams.captainName, decodedUser.username));
			if (!team) {
				throw new FoilCTF_Error('Forbidden', 403);
			}
		
			const [member] = await tx
						.select()
						.from(teamMembers)
						.where(and(
							eq(teamMembers.memberName, targetUsername),
							eq(teamMembers.teamName, team.name),
							));
			if (!member) {
				throw new FoilCTF_Error('Forbidden', 403);
			}
		
			await tx.update(teams).set({ captainName: targetUsername }).where(eq(teams.name, team.name));
		
			res.locals.captainName = member.memberName; // new captain
			res.locals.teamName = team.name;
			res.locals.contents = { title: "", message: `${decodedUser.username} made you the captain of the team` };
		});

		return next();
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.json(err);
		console.error(err);
		return res.json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export const sendJoinRequest = async(req: Request, res: Response, next: NextFunction) => {
	const	targetTeamName = req.params.teamName as string;
	const decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {
			const [dbUser] = await tx
						.select()
						.from(users)
						.where(eq(users.id, decodedUser.id));
			if (!dbUser || dbUser.teamName) {
				throw new FoilCTF_Error('Forbidden', 403);
			}

			const	[team] = await tx
						.select()
						.from(teams)
						.where(eq(teams.name, targetTeamName));
			if (!team) {
				throw new FoilCTF_Error('Not Found', 404);
			}
			if (team.isLocked === true || team.membersCount >= team.maxMembers) {
				throw new FoilCTF_Error('Forbidden', 403);
			}

			const existingRequests = await tx
				.select()
				.from(teamJoinRequests)
				.where(and(
					eq(teamJoinRequests.username, decodedUser.username),
					eq(teamJoinRequests.teamName, team.name)
				));
			if (existingRequests.length > 0) {
				throw new FoilCTF_Error('Forbidden', 403);
			}

			await tx
				.insert(teamJoinRequests)
				.values({
					teamName: targetTeamName,
					username: decodedUser.username
					});

			res.locals.captainName = team.captainName;
			res.locals.teamName = team.name;
			res.locals.contents = { title: "", message: `${decodedUser.username} sent a join request` };
		});
	
		return next();
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.json(err);
		console.error(err);
		return res.json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export const cancelJoinRequest = async(req: Request, res: Response) => {
	const decodedUser = res.locals.user;

	await db
		.delete(teamJoinRequests)
		.where(and(
			eq(teamJoinRequests.username, decodedUser.username),
			eq(teamJoinRequests.teamName, req.params.teamName as string)
			)
		);

	return res.json(new FoilCTF_Success("No Content", 204));
}

export const acceptJoinRequest = async(req: Request, res: Response, next: NextFunction) => { // data race?
	const targetTeamName = req.params.teamName as string;
	const targetUsername = req.params.username as string;
	const decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {
			const [dbUser] = await tx
						.select()
						.from(users)
						.where(eq(users.username, targetUsername));
			if (!dbUser || dbUser.teamName) {
				throw new FoilCTF_Error('Forbidden', 403);
			}
		
			const	[team] = await tx
						.select()
						.from(teams)
						.where(eq(teams.captainName, decodedUser.username));
			if (  !team
				|| team.name !== targetTeamName
				|| team.isLocked === true
				|| team.membersCount >= team.maxMembers
				) {
				throw new FoilCTF_Error('Forbidden', 403);
			}

			const [teamJoinRequest] = await tx
						.select()
						.from(teamJoinRequests)
						.where(and(
							eq(teamJoinRequests.username, targetUsername),
							eq(teamJoinRequests.teamName, targetTeamName),
							));
			if (!teamJoinRequest) {
				throw new FoilCTF_Error('Not Found', 404);
			}

			await tx.delete(teamJoinRequests).where(
					eq(teamJoinRequests.username, targetUsername), // delete all requests from that user after being accepted to a team
			);
			await tx.insert(teamMembers).values({
							memberName: targetUsername,
							teamName: targetTeamName,
							});
			await tx.update(teams).set({ membersCount: sql`${teams.membersCount} + 1` }).where(eq(teams.name, team.name));
			await tx.update(users).set({ teamName: team.name }).where(eq(users.username, targetUsername));

			res.locals.teamName = team.name;
			res.locals.contents = { title: "new member!", message: `${teamJoinRequest.username} joined the team` };
			res.locals.exception = decodedUser.username;
		});

		return next();
	} catch (err) { 
		if (err instanceof FoilCTF_Error)
			return res.json(err);
		console.error(err);
		return res.json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export const declineJoinRequest = async(req: Request, res: Response) => {
	const targetTeamName = req.params.teamName as string;
	const targetUsername = req.params.username as string;
	const decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {
			const [team] = await tx
						.select()
						.from(teams)
						.where(eq(teams.captainName, decodedUser.username));
			if (!team || targetTeamName !== team.name ) {
				throw new FoilCTF_Error('Forbidden', 403);
			}
			await tx.delete(teamJoinRequests).where(
				and(
					eq(teamJoinRequests.teamName, targetTeamName),
					eq(teamJoinRequests.username, targetUsername)
					)
			);
		});
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.json(err);
		console.error(err);
		return res.json(new FoilCTF_Error("Internal Server Error", 500));
	}

	return res.json(new FoilCTF_Success("No Content", 204));
}

export const getSentRequests = async(req: Request, res: Response) => {
	const limit = Math.max(Number(req.query.limit) || 10, 1);
	const page = Math.max(Number(req.query.page) || 1, 1);
	const search = req.query.q as string;
	const decodedUser = res.locals.user;

	const filters = [
		eq(teamJoinRequests.username, decodedUser.username)
	];
	if (search)
		filters.push(ilike(teamJoinRequests.teamName, `${search}%`));

	const dbRequests = await db
		.select()
		.from(teamJoinRequests)
		.where(and(...filters))
		.limit(limit)
		.offset(limit * (page - 1));

	const sentRequests = dbRequests.map( ({ teamName }) => teamName );

	return res.json({
		data: sentRequests,
		page,
		limit,
	});
}

export const notifyCaptain = async(res: Response) => {
	const captainName = res.locals.captainName;

	try {
		await db.transaction(async (tx) => {
			const [captainUser] = await tx
				.select()
				.from(users)
				.where(eq(users.username, captainName));
			if (!captainUser) {
				throw new FoilCTF_Error('Forbidden', 403);
			}
			const [insertedNotification] = await tx
				.insert(notifications)
				.values(res.locals.contents)
				.returning();
			if (!insertedNotification) {
				throw new Error('Could not insert into DB');
			}

			const notificationUserRow = {
				notificationId: insertedNotification.id,
				userId: captainUser.id
			}

			await tx
				.insert(notificationUsers)
				.values(notificationUserRow);
			await tx
				.update(notifications)
				.set({ isPublished: true})
				.where(eq(notifications.id, insertedNotification.id));
		});

		return res.json(new FoilCTF_Success("OK", 200));
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.json(err);
		console.error(err);
		return res.json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export const notifyAllMembers = async(res: Response) => {
	const teamName = res.locals.teamName;
	const exception = res.locals.exception;

	try {
		await db.transaction(async (tx) => {
			const membersToNotify = await tx
				.select()
				.from(users)
				.where(
					and(
						eq(users.teamName, teamName),
						ne(users.username, exception),
					)
				);
			if (membersToNotify.length === 0) {
				throw new FoilCTF_Error('Forbidden', 403);
			}

			const [insertedNotification] = await tx
				.insert(notifications)
				.values(res.locals.contents)
				.returning();
			if (!insertedNotification) {
				throw new Error('Could not insert into DB');
			}

			const notificationUserRows = membersToNotify.map( (user) => ({
				notificationId: insertedNotification.id,
				userId: user.id
			}));
			
			await tx
				.insert(notificationUsers)
				.values(notificationUserRows);
			await tx
				.update(notifications)
				.set({ isPublished: true})
				.where(eq(notifications.id, insertedNotification.id));
		});

		return res.json(new FoilCTF_Success("OK", 200));
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.json(err);
		console.error(err);
		return res.json(new FoilCTF_Error("Internal Server Error", 500));
	}
}

export const updateTeam = async(req: Request, res: Response, next: NextFunction) => {
	const decodedUser = res.locals.user;
	const {isLocked, description, maxMembers} = req.body;

	try {
		await db.transaction(async (tx) => {
			const [team] = await tx
				.select()
				.from(teams)
				.where(eq(teams.captainName, decodedUser.username));
			if (!team) {
				throw new FoilCTF_Error('Forbidden', 403);
			}

			if (isLocked !== undefined || description !== undefined || maxMembers !== undefined) {
				await tx
				.update(teams)
				.set({
					isLocked: isLocked,
					description: description,
					maxMembers: maxMembers,
				})
				.where(eq(teams.name, team.name));
			}

			return res.json(new FoilCTF_Success("Created", 201));
		});
	} catch (err) {
		if (err instanceof FoilCTF_Error)
			return res.json(err);
		console.error(err);
		return res.json(new FoilCTF_Error("Internal Server Error", 500));
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
		captainName: team.captainName,
		membersCount: team.membersCount,
		description: team.description,
		isLocked: team.isLocked,
	}));

	return res.json(dbTeamsPublicData);
}

export const getReceivedRequests = async(req: Request, res: Response) => {
	const decodedUser = res.locals.user;
	const limit = Math.max(Number(req.query.limit) || 10, 1);
	const page = Math.max(Number(req.query.page) || 1, 1);
	const search = req.query.q as string;

	const [team] = await db
		.select()
		.from(teams)
		.where(eq(teams.captainName, decodedUser.username));
	if (!team) {
		return res.json(new FoilCTF_Error('Forbidden', 403))
	}

	const filters = [
		eq(teamJoinRequests.teamName, team.name)
	];
	if (search)
		filters.push(ilike(teamJoinRequests.username, `${search}%`));

	const dbRequests = await db
		.select()
		.from(teamJoinRequests)
		.where(and(...filters))
		.limit(limit)
		.offset(limit * (page - 1));
	const receivedRequests = dbRequests.map( ({ username }) => username );
	return res.json({
		data: receivedRequests,
		page,
		limit,
	});
}
