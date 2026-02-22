import { relations } from 'drizzle-orm/relations';
import {
	users,
	profiles,
	sessions,
	ctfs,
	ctfOrganizers,
	teams,
	teamJoinRequests,
	challenges,
	hints,
	participations,
	solves,
	containers,
	ctfsChallenges,
	chatRooms,
	reports,
	teamMembers,
	friends,
	friendRequests,
	challengesAttachments,
	attachments,
	notificationUsers,
	notifications,
	messages,
} from './schema';

export const profilesRelations = relations(profiles, ({ one, many }) => ({
	user: one(users, {
		fields: [profiles.username],
		references: [users.username],
	}),
	teams: many(teams),
}));

export const usersRelations = relations(users, ({ many }) => ({
	profiles: many(profiles),
	sessions: many(sessions),
	ctfOrganizers: many(ctfOrganizers),
	teams: many(teams),
	teamJoinRequests: many(teamJoinRequests),
	challenges: many(challenges),
	reports: many(reports),
	teamMembers: many(teamMembers),
	friends_username1: many(friends, {
		relationName: 'friends_username1_users_username',
	}),
	friends_username2: many(friends, {
		relationName: 'friends_username2_users_username',
	}),
	friendRequests_senderName: many(friendRequests, {
		relationName: 'friendRequests_senderName_users_username',
	}),
	friendRequests_receiverName: many(friendRequests, {
		relationName: 'friendRequests_receiverName_users_username',
	}),
	notificationUsers: many(notificationUsers),
	messages: many(messages),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const ctfOrganizersRelations = relations(ctfOrganizers, ({ one }) => ({
	ctf: one(ctfs, {
		fields: [ctfOrganizers.ctfId],
		references: [ctfs.id],
	}),
	user: one(users, {
		fields: [ctfOrganizers.organizerId],
		references: [users.id],
	}),
}));

export const ctfsRelations = relations(ctfs, ({ many }) => ({
	ctfOrganizers: many(ctfOrganizers),
	participations: many(participations),
	solves: many(solves),
	chatRooms: many(chatRooms),
	ctfsChallenges: many(ctfsChallenges),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
	user: one(users, {
		fields: [teams.captainName],
		references: [users.username],
	}),
	profile: one(profiles, {
		fields: [teams.profileId],
		references: [profiles.id],
	}),
	teamJoinRequests: many(teamJoinRequests),
	participations: many(participations),
	solves: many(solves),
	teamMembers: many(teamMembers),
	ctfsChallenges: many(ctfsChallenges),
}));

export const teamJoinRequestsRelations = relations(
	teamJoinRequests,
	({ one }) => ({
		team: one(teams, {
			fields: [teamJoinRequests.teamName],
			references: [teams.name],
		}),
		user: one(users, {
			fields: [teamJoinRequests.username],
			references: [users.username],
		}),
	})
);

export const challengesRelations = relations(challenges, ({ one, many }) => ({
	user: one(users, {
		fields: [challenges.authorId],
		references: [users.id],
	}),
	hints: many(hints),
	solves: many(solves),
	challengesAttachments: many(challengesAttachments),
	ctfsChallenges: many(ctfsChallenges),
}));

export const hintsRelations = relations(hints, ({ one }) => ({
	challenge: one(challenges, {
		fields: [hints.challengeId],
		references: [challenges.id],
	}),
}));

export const participationsRelations = relations(
	participations,
	({ one, many }) => ({
		team: one(teams, {
			fields: [participations.teamId],
			references: [teams.id],
		}),
		ctf: one(ctfs, {
			fields: [participations.ctfId],
			references: [ctfs.id],
		}),
		containers: many(containers),
	})
);

export const solvesRelations = relations(solves, ({ one }) => ({
	ctf: one(ctfs, {
		fields: [solves.ctfId],
		references: [ctfs.id],
	}),
	challenge: one(challenges, {
		fields: [solves.challId],
		references: [challenges.id],
	}),
	team: one(teams, {
		fields: [solves.teamId],
		references: [teams.id],
	}),
}));

export const containersRelations = relations(containers, ({ one }) => ({
	participation: one(participations, {
		fields: [containers.participationId],
		references: [participations.id],
	}),
	ctfsChallenge: one(ctfsChallenges, {
		fields: [containers.ctfId],
		references: [ctfsChallenges.ctfId],
	}),
}));

export const ctfsChallengesRelations = relations(
	ctfsChallenges,
	({ one, many }) => ({
		containers: many(containers),
		ctf: one(ctfs, {
			fields: [ctfsChallenges.ctfId],
			references: [ctfs.id],
		}),
		challenge: one(challenges, {
			fields: [ctfsChallenges.challengeId],
			references: [challenges.id],
		}),
		team: one(teams, {
			fields: [ctfsChallenges.firstBloodId],
			references: [teams.id],
		}),
	})
);

export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
	ctf: one(ctfs, {
		fields: [chatRooms.ctfId],
		references: [ctfs.id],
	}),
	messages: many(messages),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
	user: one(users, {
		fields: [reports.issuerId],
		references: [users.id],
	}),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
	team: one(teams, {
		fields: [teamMembers.teamName],
		references: [teams.name],
	}),
	user: one(users, {
		fields: [teamMembers.memberName],
		references: [users.username],
	}),
}));

export const friendsRelations = relations(friends, ({ one }) => ({
	user_username1: one(users, {
		fields: [friends.username1],
		references: [users.username],
		relationName: 'friends_username1_users_username',
	}),
	user_username2: one(users, {
		fields: [friends.username2],
		references: [users.username],
		relationName: 'friends_username2_users_username',
	}),
}));

export const friendRequestsRelations = relations(friendRequests, ({ one }) => ({
	user_senderName: one(users, {
		fields: [friendRequests.senderName],
		references: [users.username],
		relationName: 'friendRequests_senderName_users_username',
	}),
	user_receiverName: one(users, {
		fields: [friendRequests.receiverName],
		references: [users.username],
		relationName: 'friendRequests_receiverName_users_username',
	}),
}));

export const challengesAttachmentsRelations = relations(
	challengesAttachments,
	({ one }) => ({
		challenge: one(challenges, {
			fields: [challengesAttachments.challengeId],
			references: [challenges.id],
		}),
		attachment: one(attachments, {
			fields: [challengesAttachments.attachmentId],
			references: [attachments.id],
		}),
	})
);

export const attachmentsRelations = relations(attachments, ({ many }) => ({
	challengesAttachments: many(challengesAttachments),
}));

export const notificationUsersRelations = relations(
	notificationUsers,
	({ one }) => ({
		user: one(users, {
			fields: [notificationUsers.userId],
			references: [users.id],
		}),
		notification: one(notifications, {
			fields: [notificationUsers.notificationId],
			references: [notifications.id],
		}),
	})
);

export const notificationsRelations = relations(notifications, ({ many }) => ({
	notificationUsers: many(notificationUsers),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
	user: one(users, {
		fields: [messages.writerId],
		references: [users.id],
	}),
	chatRoom: one(chatRooms, {
		fields: [messages.chatroomId],
		references: [chatRooms.id],
	}),
}));
