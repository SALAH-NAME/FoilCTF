import { relations } from "drizzle-orm/relations";
import { profiles, teams, users } from "./schema";

export const teamsRelations = relations(teams, ({one}) => ({
	profile: one(profiles, {
		fields: [teams.profileId],
		references: [profiles.id]
	}),
}));

export const profilesRelations = relations(profiles, ({many}) => ({
	teams: many(teams),
	users: many(users),
}));

export const usersRelations = relations(users, ({one}) => ({
	profile: one(profiles, {
		fields: [users.profileId],
		references: [profiles.id]
	}),
}));