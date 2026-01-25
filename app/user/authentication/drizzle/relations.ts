import { relations } from "drizzle-orm/relations";
import { profiles, users, ctfs, ctfOrganizers, teams, challenges, hints, participations, reports, teamMembers, challengesAttachments, attachments, notificationUsers, notifications, messages, ctfsChallenges } from "./schema";

export const usersRelations = relations(users, ({one, many}) => ({
	profile: one(profiles, {
		fields: [users.profileId],
		references: [profiles.id]
	}),
	ctfOrganizers: many(ctfOrganizers),
	challenges: many(challenges),
	reports: many(reports),
	teamMembers: many(teamMembers),
	notificationUsers: many(notificationUsers),
	messages: many(messages),
}));

export const profilesRelations = relations(profiles, ({many}) => ({
	users: many(users),
	teams: many(teams),
}));

export const ctfOrganizersRelations = relations(ctfOrganizers, ({one}) => ({
	ctf: one(ctfs, {
		fields: [ctfOrganizers.ctfId],
		references: [ctfs.id]
	}),
	user: one(users, {
		fields: [ctfOrganizers.organizerId],
		references: [users.id]
	}),
}));

export const ctfsRelations = relations(ctfs, ({many}) => ({
	ctfOrganizers: many(ctfOrganizers),
	messages: many(messages),
	ctfsChallenges: many(ctfsChallenges),
}));

export const teamsRelations = relations(teams, ({one, many}) => ({
	profile: one(profiles, {
		fields: [teams.profileId],
		references: [profiles.id]
	}),
	participations: many(participations),
	teamMembers: many(teamMembers),
}));

export const challengesRelations = relations(challenges, ({one, many}) => ({
	user: one(users, {
		fields: [challenges.authorId],
		references: [users.id]
	}),
	hints: many(hints),
	participations: many(participations),
	challengesAttachments: many(challengesAttachments),
	ctfsChallenges: many(ctfsChallenges),
}));

export const hintsRelations = relations(hints, ({one}) => ({
	challenge: one(challenges, {
		fields: [hints.challengeId],
		references: [challenges.id]
	}),
}));

export const participationsRelations = relations(participations, ({one, many}) => ({
	team: one(teams, {
		fields: [participations.teamId],
		references: [teams.id]
	}),
	challenge: one(challenges, {
		fields: [participations.challengeId],
		references: [challenges.id]
	}),
	ctfsChallenges: many(ctfsChallenges),
}));

export const reportsRelations = relations(reports, ({one}) => ({
	user: one(users, {
		fields: [reports.issuerId],
		references: [users.id]
	}),
}));

export const teamMembersRelations = relations(teamMembers, ({one}) => ({
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [teamMembers.memberId],
		references: [users.id]
	}),
}));

export const challengesAttachmentsRelations = relations(challengesAttachments, ({one}) => ({
	challenge: one(challenges, {
		fields: [challengesAttachments.challengeId],
		references: [challenges.id]
	}),
	attachment: one(attachments, {
		fields: [challengesAttachments.attachmentId],
		references: [attachments.id]
	}),
}));

export const attachmentsRelations = relations(attachments, ({many}) => ({
	challengesAttachments: many(challengesAttachments),
}));

export const notificationUsersRelations = relations(notificationUsers, ({one}) => ({
	user: one(users, {
		fields: [notificationUsers.userId],
		references: [users.id]
	}),
	notification: one(notifications, {
		fields: [notificationUsers.notificationId],
		references: [notifications.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({many}) => ({
	notificationUsers: many(notificationUsers),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	user: one(users, {
		fields: [messages.writerId],
		references: [users.id]
	}),
	ctf: one(ctfs, {
		fields: [messages.chatroomId],
		references: [ctfs.id]
	}),
}));

export const ctfsChallengesRelations = relations(ctfsChallenges, ({one}) => ({
	ctf: one(ctfs, {
		fields: [ctfsChallenges.ctfId],
		references: [ctfs.id]
	}),
	challenge: one(challenges, {
		fields: [ctfsChallenges.challengeId],
		references: [challenges.id]
	}),
	participation: one(participations, {
		fields: [ctfsChallenges.firstBloodId],
		references: [participations.id]
	}),
}));