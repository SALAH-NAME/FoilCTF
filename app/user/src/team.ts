import { NextFunction, Request, Response } from 'express';
import { db } from './utils/db';
import { eq, and, sql, ne, ilike } from 'drizzle-orm';
import { users, teams, teamMembers, teamJoinRequests, notifications, notificationUsers } from './db/schema';
import { FoilCTF_error } from './utils/types';

export const createTeam = async(req: Request, res: Response) => {
	const decodedUser = res.locals.user;
	const {newTeamName, maxMembers} = req.body;

	const [dbUser] = await db
				.select()
				.from(users)
				.where(eq(users.id, decodedUser.id));
	if (!dbUser || dbUser.teamName) {
		return res.json(new FoilCTF_error('Forbidden', 403));
	}

	const [existingTeam] = await db
				.select()
				.from(teams)
				.where(eq(teams.name, newTeamName));
	if (existingTeam) {
		return res.json(new FoilCTF_error('name already used', 409));
	}

	try {
		await db.transaction(async (tx) => {

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

		return res.status(201).send();
	} catch (err) {
		console.error(err);
		return res.status(500).send();
	}
}

export const getTeamDetails = async(req: Request, res: Response) => {
	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.name, req.params.teamName as string))

	if (!team)
		return res.json(new FoilCTF_error('Not Found', 404));

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
		return res.json(new FoilCTF_error('Not Found', 404));

	const	membersNames = members.map( ({ memberName }) => memberName );

	return res.json({
		data: membersNames,
		page,
		limit,
	});
}

export const leaveTeam = async(req: Request, res: Response, next: NextFunction) => { // data race?
	const	decodedUser = res.locals.user;

	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.name, req.params.teamName as string));
	if (!team) {
		return res.json(new FoilCTF_error('Forbidden', 403));
	}
	if (team.captainName === decodedUser.username && team.membersCount != 1) {
		return res.json(new FoilCTF_error('Forbidden', 403));	
	}

	try {
		await db.transaction(async (tx) => {
		
			await tx.delete(teamMembers).where(eq(teamMembers.memberName, decodedUser.username));
			await tx.update(teams).set({ membersCount: sql`${teams.membersCount} - 1` }).where(eq(teams.name, team.name));
			await tx.update(users).set({ teamName: null }).where(eq(users.username, decodedUser.username));
			if (team.membersCount === 1) { // last member of the team
				await tx.delete(teamJoinRequests).where(eq(teamJoinRequests.teamName, team.name));
				await tx.delete(teams).where(eq(teams.id, team.id));
			}
		});

		res.locals.teamName = team.name;
		res.locals.contents = { title: "", message: `${decodedUser.username} has left the team` };
		res.locals.exception = decodedUser.username;

		return next();
	} catch (err) {
		console.error(err);
		return res.status(500).send();
	}
}

export const deleteMember = async(req: Request, res: Response, next: NextFunction) => { // data race?
	const requestedUsername = req.params.username as string;
	const requestedTeamName = req.params.teamName as string;
	const decodedUser = res.locals.user;

	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.captainName, decodedUser.username));
	if (!team || requestedTeamName !== team.name) {
		return res.json(new FoilCTF_error('Forbidden', 403));
	}

	const [DBrequstedMember] = await db.
		select()
		.from(teamMembers)
		.where(and(
			eq(teamMembers.teamName, requestedTeamName),
			eq(teamMembers.memberName, requestedUsername)
	));
	if (!DBrequstedMember || DBrequstedMember.teamName !== team.name) {
		return res.json(new FoilCTF_error('Forbidden', 403));	
	}

	if (requestedUsername === decodedUser.username) {
		return res.json(new FoilCTF_error('Forbidden', 403));	
	}

	try {
		await db.transaction(async (tx) => {

			await tx.delete(teamMembers).where(eq(teamMembers.memberName, requestedUsername));
			await tx.update(teams).set({ membersCount: sql`${teams.membersCount} - 1` }).where(eq(teams.name, team.name));
			await tx.update(users).set({ teamName: null }).where(eq(users.username, requestedUsername));
		});

		res.locals.teamName = team.name;
		res.locals.contents = { title: "", message: `${decodedUser.username} has been deleted` };
		res.locals.exception = decodedUser.username;

		return next();
	} catch (err) {
		console.error(err);
		return res.status(500).send();
	}
}

export const handOverLeadership = async(req: Request, res: Response, next: NextFunction) => {
	const requestedUsername = req.body.username;
	const decodedUser = res.locals.user;

	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.captainName, decodedUser.username));
	if (!team) {
		return res.json(new FoilCTF_error('Forbidden', 403));
	}

	const [member] = await db
				.select()
				.from(teamMembers)
				.where(and(
					eq(teamMembers.memberName, requestedUsername),
					eq(teamMembers.teamName, team.name),
					));
	if (!member) {
		return res.json(new FoilCTF_error('Forbidden', 403));
	}

	await db.update(teams).set({ captainName: requestedUsername }).where(eq(teams.name, team.name));

	res.locals.captainName = member.memberName; // new captain
	res.locals.teamName = team.name;
	res.locals.contents = { title: "", message: `${decodedUser.username} made you the captain of the team` };

	return next();
}

export const sendJoinRequest = async(req: Request, res: Response, next: NextFunction) => {
	const	requestedTeamName = req.params.teamName as string;
	const decodedUser = res.locals.user;

	const [dbUser] = await db
				.select()
				.from(users)
				.where(eq(users.id, decodedUser.id));
	if (!dbUser || dbUser.teamName) {
		return res.json(new FoilCTF_error('Forbidden', 403));
	}

	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.name, requestedTeamName));
	if (!team) {
		return res.json(new FoilCTF_error('Not Found', 404));
	}
	if (team.isLocked === true || team.membersCount >= team.maxMembers) {
		return res.json(new FoilCTF_error('Forbidden', 403));
	}

	const existingRequests = await db
		.select()
		.from(teamJoinRequests)
		.where(and(
			eq(teamJoinRequests.username, decodedUser.username),
			eq(teamJoinRequests.teamName, team.name)
		));
	if (existingRequests.length > 0) {
		return res.json(new FoilCTF_error('Forbidden', 403));
	}

	await db
		.insert(teamJoinRequests)
		.values({
			teamName: requestedTeamName,
			username: decodedUser.username
			});

	res.locals.captainName = team.captainName;
	res.locals.teamName = team.name;
	res.locals.contents = { title: "", message: `${decodedUser.username} sent a join request` };

	return next();
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

	return res.status(204).send();
}

export const acceptJoinRequest = async(req: Request, res: Response, next: NextFunction) => { // data race?
	const requestedTeamName = req.params.teamName as string;
	const requestedUsername = req.params.username as string;
	const decodedUser = res.locals.user;

	const [dbUser] = await db
				.select()
				.from(users)
				.where(eq(users.username, requestedUsername));
	if (!dbUser || dbUser.teamName) {
		return res.json(new FoilCTF_error('Forbidden', 403));
	}

	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.captainName, decodedUser.username));
	if (  !team
		|| team.name !== requestedTeamName
		|| team.isLocked === true
		|| team.membersCount >= team.maxMembers
		) {
		return res.json(new FoilCTF_error('Forbidden', 403));
	}

	const [teamJoinRequest] = await db
				.select()
				.from(teamJoinRequests)
				.where(and(
					eq(teamJoinRequests.username, requestedUsername),
					eq(teamJoinRequests.teamName, requestedTeamName),
					));
	if (!teamJoinRequest) {
		return res.json(new FoilCTF_error('Not Found', 404));
	}

	try {
		await db.transaction(async (tx) => {

			await tx.delete(teamJoinRequests).where(
				and(
					eq(teamJoinRequests.teamName, team.name),
					eq(teamJoinRequests.username, requestedUsername),
				)
			);
			await tx.insert(teamMembers).values({
							memberName: requestedUsername,
							teamName: requestedTeamName,
							});
			// if (team.membersCount + 1 === team.maxMembers)
			// 	await tx.update(teams).set({ isLocked: true }).where(eq(teams.name, team.name));
			await tx.update(teams).set({ membersCount: sql`${teams.membersCount} + 1` }).where(eq(teams.name, team.name));
			await tx.update(users).set({ teamName: team.name }).where(eq(users.username, requestedUsername));
		});

		res.locals.teamName = team.name;
		res.locals.contents = { title: "new member!", message: `${teamJoinRequest.username} joined the team` };
		res.locals.exception = decodedUser.username;

		return next();
	} catch (err) { 
		console.error(err);
		return res.status(500).send();
	}
}

export const declineJoinRequest = async(req: Request, res: Response) => {
	const requestedTeamName = req.params.teamName as string;
	const requestedUsername = req.params.username as string;
	const decodedUser = res.locals.user;

	const [team] = await db
				.select()
				.from(teams)
				.where(eq(teams.captainName, decodedUser.username));
	if (!team || requestedTeamName !== team.name ) {
		return res.json(new FoilCTF_error('Forbidden', 403));
	}
	await db.delete(teamJoinRequests).where(
		and(
			eq(teamJoinRequests.teamName, requestedTeamName),
			eq(teamJoinRequests.username, requestedUsername)
			)
	);

	return res.status(204).send();
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

	const sentRequests = await db
		.select()
		.from(teamJoinRequests)
		.where(and(...filters))
		.limit(limit)
		.offset(limit * (page - 1));

	return res.json({
		data: sentRequests,
		page,
		limit,
	});
}

export const notifyCaptain = async(res: Response) => {
	const captainName = res.locals.captainName;

	const [captainUser] = await db
		.select()
		.from(users)
		.where(eq(users.username, captainName));
	if (!captainUser) {
		return res.json(new FoilCTF_error('Forbidden', 403));
	}

	try {
		await db.transaction(async (tx) => {
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

		return res.status(200).send();
	} catch (err) {
		console.error(err);
		return res.status(500).send();
	}
}

export const notifyAllMembers = async(res: Response) => {
	const teamName = res.locals.teamName;
	const exception = res.locals.exception;

	const membersToNotify = await db // data race?
		.select()
		.from(users)
		.where(
			and(
				eq(users.teamName, teamName),
				ne(users.username, exception),
			)
		);
	if (membersToNotify.length === 0) {
		return res.status(200).send();
	}

	try {
		await db.transaction(async (tx) => {
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

		return res.status(200).send();
	} catch (err) {
		console.error(err);
		return res.status(500).send();
	}
}

export const updateTeam = async(req: Request, res: Response, next: NextFunction) => {
	const decodedUser = res.locals.user;
	const {isLocked, description, maxMembers} = req.body;

	const [team] = await db
		.select()
		.from(teams)
		.where(eq(teams.captainName, decodedUser.username));
	if (!team) {
		return res.json(new FoilCTF_error('Forbidden', 403));
	}

	if (isLocked !== undefined || description !== undefined || maxMembers !== undefined) {
		await db
		.update(teams)
		.set({
			isLocked: isLocked,
			description: description,
			maxMembers: maxMembers,
		})
		.where(eq(teams.name, team.name));
	}

	return res.status(201).send();
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

export const getIncomingRequests = async(req: Request, res: Response) => {
}
