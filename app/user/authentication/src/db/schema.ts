import { pgTable, serial, text, check, integer, json, foreignKey, timestamp, varchar, uuid } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const profiles = pgTable("profiles", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	image: text(),
});

export const ctfs = pgTable("ctfs", {
	id: serial().primaryKey().notNull(),
	teamMembersMin: integer("team_members_min").default(1).notNull(),
	teamMembersMax: integer("team_members_max"),
	metadata: json(),
}, (table) => [
	check("constraint_members_min_gt_zero", sql`team_members_min > 0`),
	check("constraint_members_min_lteq_max", sql`team_members_min <= team_members_max`),
]);

export const teams = pgTable("teams", {
	id: serial().primaryKey().notNull(),
	profileId: integer("profile_id"),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "constraint_profile"
		}),
]);

export const attachments = pgTable("attachments", {
	id: serial().primaryKey().notNull(),
	contents: json().notNull(),
});

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	contents: json().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
	id: serial().primaryKey().notNull(),
	refreshtoken: text().notNull(),
	expiry: timestamp({ mode: 'string' }).notNull(),
	userId: varchar("user_id", { length: 64 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	password: varchar({ length: 64 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	bannedUntil: timestamp("banned_until", { mode: 'string' }),
	profileId: integer("profile_id"),
	email: text(),
	username: text(),
	avatar: text(),
	role: text(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "profile"
		}),
]);
