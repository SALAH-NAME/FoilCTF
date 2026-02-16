import { NextFunction, Request, Response } from 'express';
import { db } from './utils/db';
import { eq, and, sql, ne } from 'drizzle-orm';
import { users, teams, teamMembers, teamJoinRequests, notifications, notificationUsers } from './db/schema';

export const createTeam = async(req: Request, res: Response) => {
	const decodedUser = res.locals.user;
	const newTeamName = req.body.name;

	try {
		await db.transaction(async (tx) => {
			const [dbUser] = await tx
						.select()
						.from(users)
						.where(eq(users.id, decodedUser.id));
			if (!dbUser || dbUser.teamName) {
				throw { status: 403 }; // I know abderrahim is gonna hate this saying "it is supposed to be used for errors" but AFAIK there's no other way to specify the right status code
                                        // you gotta do what you gotta do :)
			}

			const [existingTeam] = await tx
						.select()
						.from(teams)
						.where(eq(teams.name, newTeamName));
			if (existingTeam) {
				throw { status: 409 };
			}

			await tx.insert(teams)
						.values({
						name: newTeamName,
						captainName: decodedUser.username,
						});

			await tx.insert(teamMembers).values({
				teamName: newTeamName,
				memberName: decodedUser.username,
			});
			await tx.update(users).set({ teamName: newTeamName }).where(eq(users.id, decodedUser.id));
		});
		return res.status(201).send();
	} catch (err: any) { 
		if (err.status)
			return res.status(err.status).send();
		console.error(err);
		return res.status(500).send();
	}
}

export const getTeamDetails = async(req: Request, res: Response) => {
	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.name, req.params.teamName as string));
	if (!team)
		return res.status(404).send();
	
	const {name, captainName, membersCount, ...privateInfos} = team;

	return res.json({
			name: name,
			captainName: captainName,
			membersCount: membersCount,
			});
}

export const getTeamMembers = async(req: Request, res: Response) => {
	const	members = await db
				.select()
				.from(teamMembers)
				.where(eq(teamMembers.teamName, req.params.teamName as string));
	if (!members || members.length === 0)
		return res.status(404).send();

	const	membersNames = members.map( ({ memberName }) => memberName ); // more infos maybe? e.g user avatar?

	return res.json(membersNames);
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
				throw { status: 403 };
			}
		
			if (team.captainName === decodedUser.username && team.membersCount != 1) {
				throw { status: 403 };	
			}
		
			await tx.delete(teamMembers).where(eq(teamMembers.memberName, decodedUser.username));
			await tx.update(teams).set({ membersCount: team.membersCount - 1 }).where(eq(teams.name, team.name));
			await tx.update(users).set({ teamName: null }).where(eq(users.username, decodedUser.username));
			if (team.membersCount === 0) { // last member of the team
				await tx.delete(teamJoinRequests).where(eq(teamJoinRequests.teamName, team.name));
				await tx.delete(teams).where(eq(teams.id, team.id));
			}
		
			res.locals.teamName = team.name;
			res.locals.contents = { title: "", message: `${decodedUser.username} has left the team` };
			res.locals.exception = decodedUser.username;
		});
		return next();
	} catch (err: any) { 
		if (err.status)
			return res.status(err.status).send();
		console.error(err);
		return res.status(500).send();
	}
}

export const deleteMember = async(req: Request, res: Response, next: NextFunction) => {
	const	requestedUsername = req.params.username as string;
	const	decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {
			const	[team] = await tx
						.select()
						.from(teams)
						.where(eq(teams.captainName, decodedUser.username));
			if (!team) {
				throw { status: 403 };	
			}

			const [DBrequstedMember] = await tx.
											select()
											.from(teamMembers)
											.where(and(
												eq(teamMembers.teamName, req.params.teamName as string),
												eq(teamMembers.memberName, requestedUsername)
											));
			if (!DBrequstedMember || DBrequstedMember.teamName !== team.name) {
				throw { status: 403 };	
			}
		
			if (requestedUsername === decodedUser.username) {
				throw { status: 400 };
			}

			await tx.delete(teamMembers).where(eq(teamMembers.memberName, requestedUsername));
			await tx.update(teams).set({ membersCount: team.membersCount - 1 }).where(eq(teams.name, team.name));
			await tx.update(users).set({ teamName: null }).where(eq(users.username, requestedUsername));

			res.locals.teamName = team.name;
			res.locals.contents = { title: "", message: `${decodedUser.username} has been deleted` };
			res.locals.exception = decodedUser.username;
		});
		return next();
	} catch (err: any) { 
		if (err.status)
			return res.status(err.status).send();
		console.error(err);
		return res.status(500).send();
	}
}

export const handOverLeadership = async(req: Request, res: Response, next: NextFunction) => {
	const requestedUsername = req.params?.username as string;
	const decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {
			const	[team] = await tx
						.select()
						.from(teams)
						.where(eq(teams.captainName, decodedUser.username));
			if (!team) {
				throw { status: 403 };	
			}
		
			const [member] = await tx
						.select()
						.from(teamMembers)
						.where(and(
							eq(teamMembers.memberName, requestedUsername),
							eq(teamMembers.teamName, team.name),
							));
			if (!member) {
				throw { status: 403 };	
			}
		
			await tx.update(teams).set({ captainName: requestedUsername }).where(eq(teams.name, team.name));

			res.locals.captainName = member.memberName; // new captain
			res.locals.teamName = team.name;
			res.locals.contents = { title: "", message: `${decodedUser.username} made you the captain of the team` };
		});
		return next();
	} catch (err: any) { 
		if (err.status)
			return res.status(err.status).send();
		console.error(err);
		return res.status(500).send();
	}
}

export const sendJoinRequest = async(req: Request, res: Response, next: NextFunction) => {
	const	requestedTeamName = req.params?.teamName as string;
	const decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {
			const [dbUser] = await tx
						.select()
						.from(users)
						.where(eq(users.id, decodedUser.id));
			if (!dbUser || dbUser.teamName) {
				throw { status: 403 };	
			}
		
			const	[team] = await tx
						.select()
						.from(teams)
						.where(eq(teams.name, requestedTeamName));
			if (!team) {
				throw { status: 404 };	
			}
			if (team.isLocked === true) {
				throw { status: 403 };
			}
		
			await tx
				.insert(teamJoinRequests)
				.values({
					teamName: requestedTeamName,
					username: decodedUser.username
					});

			res.locals.captainName = team.captainName;
			res.locals.teamName = team.name;
			res.locals.contents = { title: "", message: `${decodedUser.username} sent a join request` };
		});
		return next();
	} catch (err: any) { 
		if (err.status)
			return res.status(err.status).send();
		console.error(err);
		return res.status(500).send();
	}
}

export const cancelJoinRequest = async(res: Response) => {
	const decodedUser = res.locals.user;

	await db
		.delete(teamJoinRequests)
		.where(eq(teamJoinRequests.username, decodedUser.username));

	return res.status(204).send();
}

export const acceptJoinRequest = async(req: Request, res: Response, next: NextFunction) => {
	const requestedUsername = req.params.username as string;
	const decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {
			const [dbUser] = await tx
						.select()
						.from(users)
						.where(eq(users.username, requestedUsername));
			if (!dbUser || dbUser.teamName) {
				throw { status: 403 };	
			}
		
			const	[team] = await tx
						.select()
						.from(teams)
						.where(eq(teams.captainName, decodedUser.username));
			if (!team) {
				throw { status: 403 };	
			}
		
			const [teamJoinRequest] = await tx
						.select()
						.from(teamJoinRequests)
						.where(and(
							eq(teamJoinRequests.username, requestedUsername),
							eq(teamJoinRequests.teamName, team.name),
							));
			if (!teamJoinRequest) {
				throw { status: 404 };	
			}
		
			await tx.delete(teamJoinRequests).where(
				and(
					eq(teamJoinRequests.teamName, team.name),
					eq(teamJoinRequests.username, requestedUsername),
				)
			);
			await tx.insert(teamMembers).values({
							memberName: requestedUsername,
							teamName: team.name,
							});
			await tx.update(teams).set({ membersCount: sql`${teams.membersCount} + 1` }).where(eq(teams.name, team.name)); // prevent reace condition
			await tx.update(users).set({ teamName: team.name }).where(eq(users.username, requestedUsername));
		
			res.locals.teamName = team.name;
			res.locals.contents = { title: "new member!", message: `${teamJoinRequest.username} joined the team` };
			res.locals.exception = decodedUser.username;
		});
		return next();
	} catch (err: any) { 
		if (err.status)
			return res.status(err.status).send();
		console.error(err);
		return res.status(500).send();
	}
}

export const declineJoinRequest = async(req: Request, res: Response) => {
	const requestedUsername = req.params.username as string;
	const decodedUser = res.locals.user;

	try {
		await db.transaction(async (tx) => {

			const [team] = await tx
						.select()
						.from(teams)
						.where(eq(teams.captainName, decodedUser.username));
			if (!team) {
				throw { status: 403 };
			}
		
			await tx.delete(teamJoinRequests).where(
				and(
					eq(teamJoinRequests.teamName, team.name),
					eq(teamJoinRequests.username, requestedUsername)
					)
			);
		});
		return res.status(204).send();
	} catch (err: any) { 
		if (err.status)
			return res.status(err.status).send();
		console.error(err);
		return res.status(500).send();
	}
}

export const getSentRequests = async(res: Response) => {
	const decodedUser = res.locals.user;

	const sentRequests = await db
		.select()
		.from(teamJoinRequests)
		.where(eq(teamJoinRequests.username, decodedUser.username));

	return res.json(sentRequests);
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
				throw { status: 403 };
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
		return res.status(200).send();
	} catch (err: any) { 
		if (err.status)
			return res.status(err.status).send();
		console.error(err);
		return res.status(500).send();
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
				throw { status: 200 }; // :)))
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
		return res.status(200).send();
	} catch (err: any) { 
		if (err.status)
			return res.status(err.status).send();
		console.error(err);
		return res.status(500).send();
	}
}

export const updateTeam = async(req: Request, res: Response, next: NextFunction) => {
	const decodedUser = res.locals.user;
	const isLocked = req.body.isLocked;
	const description = req.body.description;

	try {
		await db.transaction(async (tx) => {
			const [team] = await tx
				.select()
				.from(teams)
				.where(eq(teams.captainName, decodedUser.username));
			if (!team) {
				throw { status: 403 };	
			}

			if (isLocked !== undefined || description !== undefined) {
				await tx
				.update(teams)
				.set({
					isLocked: isLocked,
					description: description
				})
				.where(eq(teams.name, team.name));
			}
		});
		return res.status(201).send();
	} catch (err: any) { 
		if (err.status)
			return res.status(err.status).send();
		console.error(err);
		return res.status(500).send();
	}
}

