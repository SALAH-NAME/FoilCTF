import { pgTable, unique, serial, varchar, timestamp, text, integer, foreignKey, boolean, check, json, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	password: varchar({ length: 256 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	bannedUntil: timestamp("banned_until", { mode: 'string' }),
	email: text(),
	username: text().notNull(),
	role: varchar({ length: 64 }).default('user').notNull(),
	profileId: integer("profile_id"),
	teamName: text("team_name"),
}, (table) => [
	unique("users_email_key").on(table.email),
	unique("users_username_key").on(table.username),
]);

export const profiles = pgTable("profiles", {
	id: serial().primaryKey().notNull(),
	avatar: text(),
	challengessolved: integer(),
	eventsparticipated: integer(),
	totalpoints: integer(),
	bio: text(),
	location: text(),
	socialmedialinks: text(),
	isprivate: boolean().default(false),
	username: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.username],
			foreignColumns: [users.username],
			name: "fk_username"
		}).onUpdate("cascade"),
	unique("profiles_username_key").on(table.username),
]);

export const sessions = pgTable("sessions", {
	id: serial().primaryKey().notNull(),
	expiry: timestamp({ mode: 'string' }).notNull(),
	refreshtoken: text().notNull(),
	userId: integer("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fk_id"
		}).onDelete("cascade"),
]);

export const ctfs = pgTable("ctfs", {
	id: serial().primaryKey().notNull(),
	teamMembersMin: integer("team_members_min").default(1).notNull(),
	teamMembersMax: integer("team_members_max"),
	metadata: json(),
}, (table) => [
	check("constraint_members_min_gt_zero", sql`team_members_min > 0`),
	check("constraint_members_min_lteq_max", sql`team_members_min <= team_members_max`),
]);

export const ctfOrganizers = pgTable("ctf_organizers", {
	ctfId: integer("ctf_id").notNull(),
	organizerId: integer("organizer_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ctfId],
			foreignColumns: [ctfs.id],
			name: "constraint_ctf"
		}),
	foreignKey({
			columns: [table.organizerId],
			foreignColumns: [users.id],
			name: "constraint_organizer"
		}),
]);

export const teams = pgTable("teams", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	captainName: text("captain_name").notNull(),
	membersCount: integer("members_count").default(1).notNull(),
}, (table) => [
	unique("teams_name_key").on(table.name),
]);

export const teamMembers = pgTable("team_members", {
	teamName: text("team_name").notNull(),
	memberName: text("member_name").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.teamName],
			foreignColumns: [teams.name],
			name: "constraint_team"
		}).onUpdate("cascade"),
	foreignKey({
			columns: [table.memberName],
			foreignColumns: [users.username],
			name: "constraint_member"
		}).onUpdate("cascade"),
]);

export const teamJoinRequests = pgTable("team_join_requests", {
	teamName: text("team_name").notNull(),
	username: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.teamName],
			foreignColumns: [teams.name],
			name: "constraint_team"
		}).onUpdate("cascade"),
	foreignKey({
			columns: [table.username],
			foreignColumns: [users.username],
			name: "constraint_member"
		}).onUpdate("cascade"),
]);

export const challenges = pgTable("challenges", {
	id: serial().primaryKey().notNull(),
	isPublished: boolean("is_published").default(false).notNull(),
	name: text().default('Unnamed challenge').notNull(),
	description: text().default('No description').notNull(),
	reward: integer().default(500).notNull(),
	rewardMin: integer("reward_min").default(350).notNull(),
	rewardFirstBlood: integer("reward_first_blood").default(0).notNull(),
	rewardDecrements: boolean("reward_decrements").default(true).notNull(),
	authorId: integer("author_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "constraint_author"
		}),
	check("constraint_reward", sql`reward >= reward_min`),
	check("constraint_reward_min", sql`reward_min >= 0`),
]);

export const attachments = pgTable("attachments", {
	id: serial().primaryKey().notNull(),
	contents: json().notNull(),
});

export const hints = pgTable("hints", {
	id: serial().primaryKey().notNull(),
	challengeId: integer("challenge_id").notNull(),
	penalty: integer().default(0).notNull(),
	contents: text().default('Empty hint').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.challengeId],
			foreignColumns: [challenges.id],
			name: "constraint_challenge"
		}),
]);

export const participations = pgTable("participations", {
	id: serial().primaryKey().notNull(),
	score: integer().default(0).notNull(),
	teamId: integer("team_id").notNull(),
	challengeId: integer("challenge_id").notNull(),
	lastAttemptAt: timestamp("last_attempt_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "constraint_team"
		}),
	foreignKey({
			columns: [table.challengeId],
			foreignColumns: [challenges.id],
			name: "constraint_challenge"
		}),
]);

export const containers = pgTable("containers", {
	id: serial().primaryKey().notNull(),
	participationId: integer("participation_id").notNull(),
	ctfId: integer("ctf_id").notNull(),
	challengeId: integer("challenge_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.participationId],
			foreignColumns: [participations.id],
			name: "constraint_participation"
		}),
	foreignKey({
			columns: [table.ctfId, table.challengeId],
			foreignColumns: [ctfsChallenges.ctfId, ctfsChallenges.challengeId],
			name: "constraint_ctf_challenge"
		}),
]);

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	contents: json().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	isPublished: boolean("is_published").default(false),
});

export const reports = pgTable("reports", {
	id: serial().primaryKey().notNull(),
	done: boolean().default(false).notNull(),
	contents: text().notNull(),
	issuedAt: timestamp("issued_at", { mode: 'string' }).defaultNow().notNull(),
	issuerId: integer("issuer_id"),
}, (table) => [
	foreignKey({
			columns: [table.issuerId],
			foreignColumns: [users.id],
			name: "constraint_issuer"
		}),
]);

export const challengesAttachments = pgTable("challenges_attachments", {
	challengeId: integer("challenge_id").notNull(),
	attachmentId: integer("attachment_id").notNull(),
	name: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.challengeId],
			foreignColumns: [challenges.id],
			name: "constraint_challenge"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.attachmentId],
			foreignColumns: [attachments.id],
			name: "constraint_attachment"
		}).onUpdate("cascade").onDelete("cascade"),
	primaryKey({ columns: [table.challengeId, table.attachmentId], name: "challenges_attachments_pkey"}),
]);

export const notificationUsers = pgTable("notification_users", {
	notificationId: integer("notification_id").notNull(),
	userId: integer("user_id").notNull(),
	readAt: timestamp("read_at", { mode: 'string' }),
	isDismissed: boolean("is_dismissed").default(false).notNull(),
	isRead: boolean("is_read").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "constraint_user"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.notificationId],
			foreignColumns: [notifications.id],
			name: "constraint_notification"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.notificationId], name: "notification_users_pkey"}),
]);

export const messages = pgTable("messages", {
	id: serial().notNull(),
	chatroomId: integer("chatroom_id").notNull(),
	contents: text().notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow().notNull(),
	editedAt: timestamp("edited_at", { mode: 'string' }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	writerId: integer("writer_id"),
}, (table) => [
	foreignKey({
			columns: [table.writerId],
			foreignColumns: [users.id],
			name: "constraint_writer"
		}),
	foreignKey({
			columns: [table.chatroomId],
			foreignColumns: [ctfs.id],
			name: "constraint_chatroom"
		}),
	primaryKey({ columns: [table.id, table.chatroomId], name: "messages_pkey"}),
]);

export const ctfsChallenges = pgTable("ctfs_challenges", {
	ctfId: integer("ctf_id").notNull(),
	challengeId: integer("challenge_id").notNull(),
	reward: integer().default(500).notNull(),
	attempts: integer().default(0).notNull(),
	solves: integer().default(0).notNull(),
	firstBloodAt: timestamp("first_blood_at", { mode: 'string' }),
	firstBloodId: integer("first_blood_id"),
	containerLimits: json("container_limits"),
	flag: json().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ctfId],
			foreignColumns: [ctfs.id],
			name: "constraint_ctf"
		}),
	foreignKey({
			columns: [table.challengeId],
			foreignColumns: [challenges.id],
			name: "constraint_challenge"
		}),
	foreignKey({
			columns: [table.firstBloodId],
			foreignColumns: [participations.id],
			name: "constraint_first_blood"
		}),
	primaryKey({ columns: [table.ctfId, table.challengeId], name: "ctfs_challenges_pkey"}),
]);
