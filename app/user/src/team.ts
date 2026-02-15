import { Request, Response } from 'express';
import { db } from './utils/db';
import { eq, and } from 'drizzle-orm';
import { users, teams, teamMembers, teamJoinRequests } from './db/schema';

export const createTeam = async(req: Request, res: Response) => {
	const decodedUser = res.locals.user;

	const [dbUser] = await db
				.select()
				.from(users)
				.where(eq(users.id, decodedUser.id));
	if (!dbUser || dbUser.teamName)
		return res.status(403).send();

	const newTeamName = req.body.name;
	const [existingTeam] = await db
				.select()
				.from(teams)
				.where(eq(teams.name, newTeamName));
	if (existingTeam)
		return res.status(403).send();

	await db.insert(teams)
				.values({
				name: req.body.name,
				captainName: decodedUser.username,
				});

	await db.insert(teamMembers).values({
		teamName: newTeamName,
		memberName: decodedUser.username,
	});
	await db.update(users).set({ teamName: newTeamName }).where(eq(users.id, decodedUser.id));
	return res.status(201).send();
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

export const leaveTeam = async(req: Request, res: Response) => {
	const	decodedUser = res.locals.user;

	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.name, req.params.teamName as string));
	if (!team)
		return res.status(404).send();

	if (team.captainName === decodedUser.username && team.membersCount != 1)
		return res.status(403).send();

	await db.delete(teamMembers).where(eq(teamMembers.memberName, decodedUser.username));
	await db.update(teams).set({ membersCount: team.membersCount - 1 }).where(eq(teams.name, team.name));
	if (team.membersCount === 0) // last member of the team
		await db.delete(teams).where(eq(teams.id, team.id));
	await db.update(users).set({ teamName: null }).where(eq(users.username, decodedUser.username));
	return res.status(204).send();
}

export const deleteMember = async(req: Request, res: Response) => {
	const	requestedUsername = req.params.username as string;

	const	decodedUser = res.locals.user;
	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.captainName, decodedUser.username));
	if (!team)
		return res.status(403).send();

	const [DBrequstedMember] = await db.
									select()
									.from(teamMembers)
									.where(and(
										eq(teamMembers.teamName, req.params.teamName as string),
										eq(teamMembers.memberName, requestedUsername)
									));
	if (!DBrequstedMember || DBrequstedMember.teamName !== team.name)
		return res.status(403).send();

	if (requestedUsername === decodedUser.username)
		return res.status(400).send();

	await db.delete(teamMembers).where(eq(teamMembers.memberName, requestedUsername));
	await db.update(teams).set({ membersCount: team.membersCount - 1 }).where(eq(teams.name, team.name));
	await db.update(users).set({ teamName: null }).where(eq(users.username, requestedUsername));
	return res.status(204).send();
}

export const handOverLeadership = async(req: Request, res: Response) => {
	const	requestedUsername = req.params?.username as string;

	const decodedUser = res.locals.user;

	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.captainName, decodedUser.username));
	if (!team)
		return res.status(403).send();

	
	const [member] = await db
				.select()
				.from(teamMembers)
				.where(and(
					eq(teamMembers.memberName, requestedUsername),
					eq(teamMembers.teamName, team.name),
					));
	if (!member)
		return res.status(403).send();
	await db.update(teams).set({ captainName: requestedUsername }).where(eq(teams.name, team.name));
	return res.status(200).send();
}

export const sendJoinRequest = async(req: Request, res: Response) => {
	const	requestedTeamName = req.params?.teamName as string;

	const decodedUser = res.locals.user;
	const [dbUser] = await db
				.select()
				.from(users)
				.where(eq(users.id, decodedUser.id));
	if (!dbUser || dbUser.teamName)
		return res.status(403).send();

	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.name, requestedTeamName));
	if (!team)
		return res.status(404).send();

	await db
		.insert(teamJoinRequests)
		.values({
			teamName: requestedTeamName,
			username: decodedUser.username
			});
	return res.status(201).send();
}

export const cancelJoinRequest = async(res: Response) => {
	const decodedUser = res.locals.user;
	await db
		.delete(teamJoinRequests)
		.where(eq(teamJoinRequests.username, decodedUser.username));
	return res.status(204).send();
}

export const acceptJoinRequest = async(req: Request, res: Response) => {
	const	requestedUsername = req.params.username as string;

	const decodedUser = res.locals.user;
	const [dbUser] = await db
				.select()
				.from(users)
				.where(eq(users.username, requestedUsername));
	if (!dbUser || dbUser.teamName)
		return res.status(403).send();

	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.captainName, decodedUser.username));
	if (!team)
		return res.status(403).send();

	const [teamJoinRequest] = await db
				.select()
				.from(teamJoinRequests)
				.where(and(
					eq(teamJoinRequests.username, requestedUsername),
					eq(teamJoinRequests.teamName, team.name),
					));
	if (!teamJoinRequest)
		return res.status(404).send();

	await db.delete(teamJoinRequests).where(eq(teamJoinRequests.teamName, team.name));
	await db.insert(teamMembers).values({
					memberName: requestedUsername,
					teamName: team.name,
					});
	await db.update(teams).set({ membersCount: team.membersCount + 1 }).where(eq(teams.name, team.name));
	await db.update(users).set({ teamName: team.name }).where(eq(users.username, requestedUsername));
	return res.status(201).send();
}

export const declineJoinRequest = async(req: Request, res: Response) => {
	const requestedUsername = req.params.username as string;
	const decodedUser = res.locals.user;

	const [team] = await db
				.select()
				.from(teams)
				.where(eq(teams.captainName, decodedUser.username));
	if (!team)
		return res.status(403).send();

	await db.delete(teamJoinRequests).where(and(
											eq(teamJoinRequests.teamName, team.name),
											eq(teamJoinRequests.username, requestedUsername)
											)
										);
	return res.status(204).send();
}

export const getSentRequests = async(res: Response) => {
	const decodedUser = res.locals.user;

	const sentRequests = await db
								.select()
								.from(teamJoinRequests)
								.where(eq(teamJoinRequests.username, decodedUser.username));
	return res.json(sentRequests);
}

