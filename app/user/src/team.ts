import { Request, Response, NextFunction } from 'express';
import { db } from './utils/db';
import { eq } from 'drizzle-orm';
import { users, teams, teamMembers } from './db/schema';

export const createTeam = async(req: Request, res: Response, next: NextFunction) => {
	const decodedUser = res.locals.user;

	const [dbUser] = await db
			.select()
			.from(users)
			.where(eq(users.id, decodedUser.id));
	if (!dbUser)
		return res.status(403).send();

	if (dbUser.teamId)
		return res.status(403).send('You already have a team');

	await db.insert(teams).values({
		name: req.body.title,
		captainName: dbUser.username,
		inviteCode: "12345", // generate random password and hash it before storing it in db maybe?
	})
	//add in team_members as the only team member
	return res.status(201).send();
}

export const getTeamDetails = async(req: Request, res: Response, next: NextFunction) => {
	const	requestedTeamName = req.params?.teamName as string;
	if (!requestedTeamName)
		return res.status(400).send();

	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.name, requestedTeamName));

	if (!team)
		return res.status(404).send();
	return res.json(team);
}

export const getTeamMembers = async(req: Request, res: Response, next: NextFunction) => {
	const	requestedTeamName = req.params?.teamName as string;
	if (!requestedTeamName)
		return res.status(400).send();

	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.name, requestedTeamName));
	if (!team)
		return res.status(404).send();

	const	[members] = await db
				.select()
				.from(teamMembers)
				.where(eq(teamMembers.teamId, team.id));
	if (!teamMembers)
		return res.status(404).send();
	return res.json(teamMembers); // might need to change the team_member from id to username
}

export const joinTeam = async(req: Request, res: Response, next: NextFunction) => {
	const	requestedTeamName = req.params?.teamName as string;
	if (!requestedTeamName)
		return res.status(400).send();

	const decodedUser = res.locals.user;
	const	[requestedUser] = await db
				.select()
				.from(users)
				.where(eq(users.id, decodedUser.id));
	if (!requestedUser)
		return res.status(403).send();
	if (requestedUser.teamId)
		return res.status(403).send('You already belong to a team');

	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.name, requestedTeamName));
	if (!team)
		return res.status(404).send();
	if (team.inviteCode !== req.body?.inviteCode) // compare using bcrypt?
		return res.status(403).send();

	await db.insert(teamMembers).values({
					memberId: decodedUser.id,
					teamId: team.id,
					});
	requestedUser.teamId = team.id; // database ??
	return res.status(201).send();
}

export const leaveTeam = async(req: Request, res: Response, next: NextFunction) => {
	const	requestedTeamName = req.params?.teamName as string;
	if (!requestedTeamName)
		return res.status(400).send();

	const	decodedUser = res.locals.user;
	const	[requestedUser] = await db
				.select()
				.from(users)
				.where(eq(users.id, decodedUser.id));
	if (!requestedUser || !(requestedUser.teamId))
		return res.status(403).send();

	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.name, requestedTeamName));
	if (!team)
		return res.status(404).send();
	if (team.id !== requestedUser.teamId)
		return res.status(403).send("You can't leave a team you don't belong to");

	if (team.captainName === requestedUser.username)
		return res.status(403).send("You can't leave the team: you are the captain");

	await db.delete(teamMembers).where(eq(teamMembers.memberId, decodedUser.id));
	requestedUser.teamId = null; // database ??
	return res.status(204).send();
}

export const kickTeammate = async(req: Request, res: Response, next: NextFunction) => {
	const	requestedUsername = req.params?.username as string;
	const	requestedTeamName = req.params?.teamName as string;
	if (!requestedTeamName || requestedUsername)
		return res.status(400).send();

	const	[requestedUser] = await db
				.select()
				.from(users)
				.where(eq(users.username, requestedUsername));
	if (!requestedUser || !(requestedUser.teamId)) // user does not exist or does not belong to any team
		return res.status(404).send();

	const	[team] = await db
				.select()
				.from(teams)
				.where(eq(teams.name, requestedTeamName));
	if (!team || team.id !== requestedUser.teamId) // team does not exist or user does not belong to that specific team
		return res.status(404).send();

	const	decodedUser = res.locals.user;
	if (team.captainName !== decodedUser.username) // captain check
		return res.status(403).send("Only the captain is allowed to kick a member out");

	await db.delete(teamMembers).where(eq(teamMembers.memberId, requestedUser.id));
	requestedUser.teamId = null; // database ??
	return res.status(204).send();
}

// export const handOverLeadership = async() ...
