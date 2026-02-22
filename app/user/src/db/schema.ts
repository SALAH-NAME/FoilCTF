import { pgTable, foreignKey, serial, text, integer, boolean, varchar, timestamp, check, json } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: serial().notNull(),
	password: varchar({ length: 256 }).notNull(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	banned_until: timestamp({ mode: 'string' }),
	email: text(),
	username: text().notNull(),
	role: varchar({ length: 64 }).default('user').notNull(),
	oauth42_login: text(),
	profile_id: integer(),
	team_name: text(),
}, (table) => [
	foreignKey({
		columns: [table.profile_id],
		foreignColumns: [profiles.id],
		name: "profile"
	}),
]);

export const profiles = pgTable("profiles", {
	id: serial().notNull(),
	avatar: text(),
	challengessolved: integer(),
	eventsparticipated: integer(),
	totalpoints: integer(),
	bio: text(),
	location: text(),
	socialmedialinks: text(),
	isprivate: boolean().default(false),
	username: text().notNull(),
});

export const sessions = pgTable("sessions", {
	id: serial().notNull(),
	expiry: timestamp({ mode: 'string' }).notNull(),
	refreshtoken: text().notNull(),
	user_id: integer().notNull(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [users.id],
			name: "fk_id"
		}).onDelete("cascade"),
]);

export const ctfs = pgTable("ctfs", {
	id: serial().notNull(),
	name: text().default('New Event').notNull(),
	status: text().default('draft').notNull(),
	start_time: timestamp({ mode: 'string' }).defaultNow().notNull(),
	end_time: timestamp({ mode: 'string' }).defaultNow().notNull(),
	deleted_at: timestamp({ mode: 'string' }),
	team_members_min: integer().default(1).notNull(),
	team_members_max: integer(),
	max_teams: integer(),
	metadata: json(),
}, () => [
	check("ctfs_status_check", sql`status = ANY (ARRAY['draft'::text, 'published'::text, 'active'::text, 'ended'::text])`),
	check("ctfs_max_teams_check", sql`max_teams > 0`),
	check("constraint_members_min_gt_zero", sql`team_members_min > 0`),
	check("constraint_members_min_lteq_max", sql`team_members_min <= team_members_max`),
]);

export const ctf_organizers = pgTable("ctf_organizers", {
	ctf_id: integer().notNull(),
	organizer_id: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ctf_id],
			foreignColumns: [ctfs.id],
			name: "constraint_ctf"
		}),
	foreignKey({
			columns: [table.organizer_id],
			foreignColumns: [users.id],
			name: "constraint_organizer"
		}),
]);

export const teams = pgTable("teams", {
	id: serial().notNull(),
	name: text().notNull(),
	captain_name: text().notNull(),
	max_members: integer().default(1).notNull(),
	members_count: integer().default(1).notNull(),
	description: text(),
	is_locked: boolean().default(false),
}, (table) => [
	foreignKey({
			columns: [table.captain_name],
			foreignColumns: [users.username],
			name: "constraint_captain_name"
		}).onUpdate("cascade"),
]);

export const team_members = pgTable("team_members", {
	team_name: text().notNull(),
	member_name: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.team_name],
			foreignColumns: [teams.name],
			name: "constraint_team"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.member_name],
			foreignColumns: [users.username],
			name: "constraint_member"
		}).onUpdate("cascade"),
]);

export const team_join_requests = pgTable("team_join_requests", {
	team_name: text().notNull(),
	username: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.team_name],
			foreignColumns: [teams.name],
			name: "constraint_team"
		}).onUpdate("cascade"),
	foreignKey({
			columns: [table.username],
			foreignColumns: [users.username],
			name: "constraint_member"
		}).onUpdate("cascade"),
]);

export const friends = pgTable("friends", {
	username_1: text().notNull(),
	username_2: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.username_1],
			foreignColumns: [users.username],
			name: "constraint_user1"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.username_2],
			foreignColumns: [users.username],
			name: "constraint_user2"
		}).onUpdate("cascade").onDelete("cascade"),
	check("constraint_self_friend", sql`username_1 <> username_2`),
]);

export const friend_requests = pgTable("friend_requests", {
	sender_name: text().notNull(),
	receiver_name: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sender_name],
			foreignColumns: [users.username],
			name: "constraint_user_sender"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.receiver_name],
			foreignColumns: [users.username],
			name: "constraint_user_receiver"
		}).onUpdate("cascade").onDelete("cascade"),
	check("constraint_self_friend", sql`sender_name <> receiver_name`),
]);

export const challenges = pgTable("challenges", {
	id: serial().notNull(),
	is_published: boolean().default(false).notNull(),
	name: text().default('Unnamed challenge').notNull(),
	description: text().default('No description').notNull(),
	category: text().notNull(),
	reward: integer().default(500).notNull(),
	reward_min: integer().default(350).notNull(),
	reward_first_blood: integer().default(0).notNull(),
	reward_decrements: boolean().default(true).notNull(),
	author_id: integer().notNull(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.author_id],
			foreignColumns: [users.id],
			name: "constraint_author"
		}),
	check("constraint_reward", sql`reward >= reward_min`),
	check("constraint_reward_min", sql`reward_min >= 0`),
]);

export const challenges_attachments = pgTable("challenges_attachments", {
	challenge_id: integer().notNull(),
	attachment_id: integer().notNull(),
	name: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.challenge_id],
			foreignColumns: [challenges.id],
			name: "constraint_challenge"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.attachment_id],
			foreignColumns: [attachments.id],
			name: "constraint_attachment"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const attachments = pgTable("attachments", {
	id: serial().notNull(),
	contents: json().notNull(),
});

export const hints = pgTable("hints", {
	id: serial().notNull(),
	challenge_id: integer().notNull(),
	penalty: integer().default(0).notNull(),
	contents: text().default('Empty hint').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.challenge_id],
			foreignColumns: [challenges.id],
			name: "constraint_challenge"
		}),
]);

export const participations = pgTable("participations", {
	id: serial().notNull(),
	score: integer().default(0).notNull(),
	solves: integer().default(0).notNull(),
	team_id: integer().notNull(),
	ctf_id: integer().notNull(),
	last_attempt_at: timestamp({ mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.team_id],
			foreignColumns: [teams.id],
			name: "constraint_team"
		}),
	foreignKey({
			columns: [table.ctf_id],
			foreignColumns: [ctfs.id],
			name: "constraint_ctfs"
		}),
]);

export const ctfs_challenges = pgTable("ctfs_challenges", {
	ctf_id: integer().notNull(),
	challenge_id: integer().notNull(),
	reward: integer().default(500).notNull(),
	attempts: integer().default(0).notNull(),
	solves: integer().default(0).notNull(),
	released_at: timestamp({ mode: 'string' }),
	is_hidden: boolean().default(false),
	first_blood_at: timestamp({ mode: 'string' }),
	first_blood_id: integer(),
	container_limits: json(),
	flag: json().notNull(),
	requires_challenge_id: integer(),
	decay: integer().default(50).notNull(),
	reward_min: integer().default(100).notNull(),
	reward_first_blood: integer().default(0).notNull(),
	reward_decrements: boolean().default(true).notNull(),
	initial_reward: integer().default(500).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ctf_id],
			foreignColumns: [ctfs.id],
			name: "constraint_ctf"
		}),
	foreignKey({
			columns: [table.challenge_id],
			foreignColumns: [challenges.id],
			name: "constraint_challenge"
		}),
	foreignKey({
			columns: [table.first_blood_id],
			foreignColumns: [teams.id],
			name: "constraint_first_blood"
		}),
	check("constraint_decay_positive", sql`decay > 0`),
]);

export const solves = pgTable("solves", {
	id: serial().notNull(),
	ctf_id: integer().notNull(),
	team_id: integer().notNull(),
	chall_id: integer().notNull(),
	score: integer().notNull(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ctf_id],
			foreignColumns: [ctfs.id],
			name: "fk_solves_ctf"
		}),
	foreignKey({
			columns: [table.chall_id],
			foreignColumns: [challenges.id],
			name: "fk_solves_challenge"
		}),
	foreignKey({
			columns: [table.team_id],
			foreignColumns: [teams.id],
			name: "fk_solves_team"
		}),
]);

export const containers = pgTable("containers", {
	id: serial().notNull(),
	participation_id: integer().notNull(),
	ctf_id: integer().notNull(),
	challenge_id: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.participation_id],
			foreignColumns: [participations.id],
			name: "constraint_participation"
		}),
	foreignKey({
			columns: [table.ctf_id, table.challenge_id],
			foreignColumns: [ctfs_challenges.challenge_id, ctfs_challenges.ctf_id],
			name: "constraint_ctf_challenge"
		}),
]);

export const notifications = pgTable("notifications", {
	id: serial().notNull(),
	contents: json().notNull(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	is_published: boolean().default(false),
});

export const notification_users = pgTable("notification_users", {
	notification_id: integer().notNull(),
	user_id: integer().notNull(),
	read_at: timestamp({ mode: 'string' }),
	is_dismissed: boolean().default(false).notNull(),
	is_read: boolean().default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [users.id],
			name: "constraint_user"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.notification_id],
			foreignColumns: [notifications.id],
			name: "constraint_notification"
		}).onDelete("cascade"),
]);

export const chat_rooms = pgTable("chat_rooms", {
	id: serial().notNull(),
	ctf_id: integer().notNull(),
	team_id: integer(),
	room_type: varchar({ length: 20 }).default('team'),
}, (table) => [
	foreignKey({
			columns: [table.ctf_id],
			foreignColumns: [ctfs.id],
			name: "fk_chat_room_ctf"
		}),
	check("chat_rooms_room_type_check", sql`(room_type)::text = ANY ((ARRAY['global'::character varying, 'team'::character varying, 'admin'::character varying])::text[])`),
]);

export const messages = pgTable("messages", {
	id: serial().notNull(),
	chatroom_id: integer().notNull(),
	contents: text().notNull(),
	sent_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	edited_at: timestamp({ mode: 'string' }),
	deleted_at: timestamp({ mode: 'string' }),
	writer_id: integer(),
}, (table) => [
	foreignKey({
			columns: [table.writer_id],
			foreignColumns: [users.id],
			name: "constraint_writer"
		}),
	foreignKey({
			columns: [table.chatroom_id],
			foreignColumns: [chat_rooms.id],
			name: "constraint_room"
		}),
]);

export const reports = pgTable("reports", {
	id: serial().notNull(),
	done: boolean().default(false).notNull(),
	contents: text().notNull(),
	issued_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	issuer_id: integer(),
}, (table) => [
	foreignKey({
			columns: [table.issuer_id],
			foreignColumns: [users.id],
			name: "constraint_issuer"
		}),
]);
