import { relations } from 'drizzle-orm/relations';
import { profiles, users, sessions, teams } from './schema';

export const usersRelations = relations(users, ({ one, many }) => ({
	profile: one(profiles, {
		fields: [users.profileId],
		references: [profiles.id],
	}),
	sessions: many(sessions),
}));

export const profilesRelations = relations(profiles, ({ many }) => ({
	users: many(users),
	teams: many(teams),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const teamsRelations = relations(teams, ({ one }) => ({
	profile: one(profiles, {
		fields: [teams.profileId],
		references: [profiles.id],
	}),
}));
