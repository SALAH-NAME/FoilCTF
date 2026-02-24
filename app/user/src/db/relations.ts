import { relations } from "drizzle-orm/relations";
import { users, profiles, sessions, ctfs, ctf_organizers, teams, team_members, team_join_requests, friends, friend_requests, challenges, challenges_attachments, attachments, hints, participations, ctfs_challenges, solves, containers, notification_users, notifications, chat_rooms, messages, reports } from "./schema";

export const profilesRelations = relations(profiles, ({one, many}) => ({
	user: one(users, {
		fields: [profiles.username],
		references: [users.username],
		relationName: "profiles_username_users_username"
	}),
	users: many(users, {
		relationName: "users_profile_id_profiles_id"
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	profiles: many(profiles, {
		relationName: "profiles_username_users_username"
	}),
	profile: one(profiles, {
		fields: [users.profile_id],
		references: [profiles.id],
		relationName: "users_profile_id_profiles_id"
	}),
	sessions: many(sessions),
	ctf_organizers: many(ctf_organizers),
	teams: many(teams),
	team_members: many(team_members),
	team_join_requests: many(team_join_requests),
	friends_username_1: many(friends, {
		relationName: "friends_username_1_users_username"
	}),
	friends_username_2: many(friends, {
		relationName: "friends_username_2_users_username"
	}),
	friend_requests_sender_name: many(friend_requests, {
		relationName: "friend_requests_sender_name_users_username"
	}),
	friend_requests_receiver_name: many(friend_requests, {
		relationName: "friend_requests_receiver_name_users_username"
	}),
	challenges: many(challenges),
	notification_users: many(notification_users),
	messages: many(messages),
	reports: many(reports),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.user_id],
		references: [users.id]
	}),
}));

export const ctf_organizersRelations = relations(ctf_organizers, ({one}) => ({
	ctf: one(ctfs, {
		fields: [ctf_organizers.ctf_id],
		references: [ctfs.id]
	}),
	user: one(users, {
		fields: [ctf_organizers.organizer_id],
		references: [users.id]
	}),
}));

export const ctfsRelations = relations(ctfs, ({many}) => ({
	ctf_organizers: many(ctf_organizers),
	participations: many(participations),
	ctfs_challenges: many(ctfs_challenges),
	solves: many(solves),
	chat_rooms: many(chat_rooms),
}));

export const teamsRelations = relations(teams, ({one, many}) => ({
	user: one(users, {
		fields: [teams.captain_name],
		references: [users.username]
	}),
	team_members: many(team_members),
	team_join_requests: many(team_join_requests),
	participations: many(participations),
	ctfs_challenges: many(ctfs_challenges),
	solves: many(solves),
}));

export const team_membersRelations = relations(team_members, ({one}) => ({
	team: one(teams, {
		fields: [team_members.team_name],
		references: [teams.name]
	}),
	user: one(users, {
		fields: [team_members.member_name],
		references: [users.username]
	}),
}));

export const team_join_requestsRelations = relations(team_join_requests, ({one}) => ({
	team: one(teams, {
		fields: [team_join_requests.team_name],
		references: [teams.name]
	}),
	user: one(users, {
		fields: [team_join_requests.username],
		references: [users.username]
	}),
}));

export const friendsRelations = relations(friends, ({one}) => ({
	user_username_1: one(users, {
		fields: [friends.username_1],
		references: [users.username],
		relationName: "friends_username_1_users_username"
	}),
	user_username_2: one(users, {
		fields: [friends.username_2],
		references: [users.username],
		relationName: "friends_username_2_users_username"
	}),
}));

export const friend_requestsRelations = relations(friend_requests, ({one}) => ({
	user_sender_name: one(users, {
		fields: [friend_requests.sender_name],
		references: [users.username],
		relationName: "friend_requests_sender_name_users_username"
	}),
	user_receiver_name: one(users, {
		fields: [friend_requests.receiver_name],
		references: [users.username],
		relationName: "friend_requests_receiver_name_users_username"
	}),
}));

export const challengesRelations = relations(challenges, ({one, many}) => ({
	user: one(users, {
		fields: [challenges.author_id],
		references: [users.id]
	}),
	challenges_attachments: many(challenges_attachments),
	hints: many(hints),
	ctfs_challenges: many(ctfs_challenges),
	solves: many(solves),
}));

export const challenges_attachmentsRelations = relations(challenges_attachments, ({one}) => ({
	challenge: one(challenges, {
		fields: [challenges_attachments.challenge_id],
		references: [challenges.id]
	}),
	attachment: one(attachments, {
		fields: [challenges_attachments.attachment_id],
		references: [attachments.id]
	}),
}));

export const attachmentsRelations = relations(attachments, ({many}) => ({
	challenges_attachments: many(challenges_attachments),
}));

export const hintsRelations = relations(hints, ({one}) => ({
	challenge: one(challenges, {
		fields: [hints.challenge_id],
		references: [challenges.id]
	}),
}));

export const participationsRelations = relations(participations, ({one, many}) => ({
	team: one(teams, {
		fields: [participations.team_id],
		references: [teams.id]
	}),
	ctf: one(ctfs, {
		fields: [participations.ctf_id],
		references: [ctfs.id]
	}),
	containers: many(containers),
}));

export const ctfs_challengesRelations = relations(ctfs_challenges, ({one, many}) => ({
	ctf: one(ctfs, {
		fields: [ctfs_challenges.ctf_id],
		references: [ctfs.id]
	}),
	challenge: one(challenges, {
		fields: [ctfs_challenges.challenge_id],
		references: [challenges.id]
	}),
	team: one(teams, {
		fields: [ctfs_challenges.first_blood_id],
		references: [teams.id]
	}),
	containers: many(containers),
}));

export const solvesRelations = relations(solves, ({one}) => ({
	ctf: one(ctfs, {
		fields: [solves.ctf_id],
		references: [ctfs.id]
	}),
	challenge: one(challenges, {
		fields: [solves.chall_id],
		references: [challenges.id]
	}),
	team: one(teams, {
		fields: [solves.team_id],
		references: [teams.id]
	}),
}));

export const containersRelations = relations(containers, ({one}) => ({
	participation: one(participations, {
		fields: [containers.participation_id],
		references: [participations.id]
	}),
	ctfs_challenge: one(ctfs_challenges, {
		fields: [containers.ctf_id],
		references: [ctfs_challenges.ctf_id]
	}),
}));

export const notification_usersRelations = relations(notification_users, ({one}) => ({
	user: one(users, {
		fields: [notification_users.user_id],
		references: [users.id]
	}),
	notification: one(notifications, {
		fields: [notification_users.notification_id],
		references: [notifications.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({many}) => ({
	notification_users: many(notification_users),
}));

export const chat_roomsRelations = relations(chat_rooms, ({one, many}) => ({
	ctf: one(ctfs, {
		fields: [chat_rooms.ctf_id],
		references: [ctfs.id]
	}),
	messages: many(messages),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	user: one(users, {
		fields: [messages.writer_id],
		references: [users.id]
	}),
	chat_room: one(chat_rooms, {
		fields: [messages.chatroom_id],
		references: [chat_rooms.id]
	}),
}));

export const reportsRelations = relations(reports, ({one}) => ({
	user: one(users, {
		fields: [reports.issuer_id],
		references: [users.id]
	}),
}));