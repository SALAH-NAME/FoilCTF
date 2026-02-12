import {
	pgTable,
	unique,
	serial,
	text,
	integer,
	boolean,
	foreignKey,
	varchar,
	timestamp,
	check,
	json,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const profiles = pgTable(
	'profiles',
	{
		id: serial().primaryKey().notNull(),
		username: text(),
		avatar: text(),
		challengessolved: integer(),
		eventsparticipated: integer(),
		totalpoints: integer(),
		bio: text(),
		location: text(),
		socialmedialinks: text(),
		isprivate: boolean().default(false),
	},
	(table) => [unique('profiles_username_key').on(table.username)]
);

export const users = pgTable(
	'users',
	{
		id: serial().primaryKey().notNull(),
		password: varchar({ length: 64 }).notNull(),
		createdAt: timestamp('created_at', { mode: 'string' })
			.defaultNow()
			.notNull(),
		bannedUntil: timestamp('banned_until', { mode: 'string' }),
		email: text(),
		username: text().notNull(),
		role: varchar({ length: 64 }).default('user').notNull(),
		profileId: integer('profile_id'),
		oauth42_login: text('oauth42_login'),
	},
	(table) => [
		foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: 'profile',
		}),
		unique('users_email_key').on(table.email),
		unique('users_username_key').on(table.username),
		unique('users_oauth42_login_key').on(table.oauth42_login),
	]
);

export const sessions = pgTable(
	'sessions',
	{
		id: serial().primaryKey().notNull(),
		expiry: timestamp({ mode: 'string' }).notNull(),
		refreshtoken: text().notNull(),
		userId: integer('user_id').notNull(),
		createdAt: timestamp('created_at', { mode: 'string' }).default(
			sql`CURRENT_TIMESTAMP`
		),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'fk_id',
		}).onDelete('cascade'),
	]
);

export const ctfs = pgTable(
	'ctfs',
	{
		id: serial().primaryKey().notNull(),
		teamMembersMin: integer('team_members_min').default(1).notNull(),
		teamMembersMax: integer('team_members_max'),
		metadata: json(),
	},
	(table) => [
		check('constraint_members_min_gt_zero', sql`team_members_min > 0`),
		check(
			'constraint_members_min_lteq_max',
			sql`team_members_min <= team_members_max`
		),
	]
);

export const teams = pgTable(
	'teams',
	{
		id: serial().primaryKey().notNull(),
		profileId: integer('profile_id'),
	},
	(table) => [
		foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: 'constraint_profile',
		}),
	]
);

export const attachments = pgTable('attachments', {
	id: serial().primaryKey().notNull(),
	contents: json().notNull(),
});

export const notifications = pgTable('notifications', {
	id: serial().primaryKey().notNull(),
	contents: json().notNull(),
	createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});
