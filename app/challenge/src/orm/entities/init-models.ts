import type { Sequelize } from 'sequelize';
import { attachments as _attachments } from './Attachments.ts';
import type {
	attachmentsAttributes,
	attachmentsCreationAttributes,
} from './Attachments.ts';
import { challenges as _challenges } from './Challenges.ts';
import type {
	challengesAttributes,
	challengesCreationAttributes,
} from './Challenges.ts';
import { challenges_attachments as _challenges_attachments } from './ChallengesAttachments.ts';
import type {
	challenges_attachmentsAttributes,
	challenges_attachmentsCreationAttributes,
} from './ChallengesAttachments.ts';
import { ctf_organizers as _ctf_organizers } from './CtfOrganizers.ts';
import type {
	ctf_organizersAttributes,
	ctf_organizersCreationAttributes,
} from './CtfOrganizers.ts';
import { ctfs as _ctfs } from './Ctfs.ts';
import type { ctfsAttributes, ctfsCreationAttributes } from './Ctfs.ts';
import { ctfs_challenges as _ctfs_challenges } from './CtfsChallenges.ts';
import type {
	ctfs_challengesAttributes,
	ctfs_challengesCreationAttributes,
} from './CtfsChallenges.ts';
import { hints as _hints } from './Hints.ts';
import type { hintsAttributes, hintsCreationAttributes } from './Hints.ts';
import { messages as _messages } from './Messages.ts';
import type {
	messagesAttributes,
	messagesCreationAttributes,
} from './Messages.ts';
import { notification_users as _notification_users } from './NotificationUsers.ts';
import type {
	notification_usersAttributes,
	notification_usersCreationAttributes,
} from './NotificationUsers.ts';
import { notifications as _notifications } from './Notifications.ts';
import type {
	notificationsAttributes,
	notificationsCreationAttributes,
} from './Notifications.ts';
import { participations as _participations } from './Participations.ts';
import type {
	participationsAttributes,
	participationsCreationAttributes,
} from './Participations.ts';
import { profiles as _profiles } from './Profiles.ts';
import type {
	profilesAttributes,
	profilesCreationAttributes,
} from './Profiles.ts';
import { reports as _reports } from './Reports.ts';
import type {
	reportsAttributes,
	reportsCreationAttributes,
} from './Reports.ts';
import { sessions as _sessions } from './Sessions.ts';
import type {
	sessionsAttributes,
	sessionsCreationAttributes,
} from './Sessions.ts';
import { team_members as _team_members } from './TeamMembers.ts';
import type {
	team_membersAttributes,
	team_membersCreationAttributes,
} from './TeamMembers.ts';
import { teams as _teams } from './Teams.ts';
import type { teamsAttributes, teamsCreationAttributes } from './Teams.ts';
import { users as _users } from './Users.ts';
import type { usersAttributes, usersCreationAttributes } from './Users.ts';

export {
	_attachments as attachments,
	_challenges as challenges,
	_challenges_attachments as challenges_attachments,
	_ctf_organizers as ctf_organizers,
	_ctfs as ctfs,
	_ctfs_challenges as ctfs_challenges,
	_hints as hints,
	_messages as messages,
	_notification_users as notification_users,
	_notifications as notifications,
	_participations as participations,
	_profiles as profiles,
	_reports as reports,
	_sessions as sessions,
	_team_members as team_members,
	_teams as teams,
	_users as users,
};

export type {
	attachmentsAttributes,
	attachmentsCreationAttributes,
	challengesAttributes,
	challengesCreationAttributes,
	challenges_attachmentsAttributes,
	challenges_attachmentsCreationAttributes,
	ctf_organizersAttributes,
	ctf_organizersCreationAttributes,
	ctfsAttributes,
	ctfsCreationAttributes,
	ctfs_challengesAttributes,
	ctfs_challengesCreationAttributes,
	hintsAttributes,
	hintsCreationAttributes,
	messagesAttributes,
	messagesCreationAttributes,
	notification_usersAttributes,
	notification_usersCreationAttributes,
	notificationsAttributes,
	notificationsCreationAttributes,
	participationsAttributes,
	participationsCreationAttributes,
	profilesAttributes,
	profilesCreationAttributes,
	reportsAttributes,
	reportsCreationAttributes,
	sessionsAttributes,
	sessionsCreationAttributes,
	team_membersAttributes,
	team_membersCreationAttributes,
	teamsAttributes,
	teamsCreationAttributes,
	usersAttributes,
	usersCreationAttributes,
};

export function initModels(sequelize: Sequelize) {
	const attachments = _attachments.initModel(sequelize);
	const challenges = _challenges.initModel(sequelize);
	const challenges_attachments = _challenges_attachments.initModel(sequelize);
	const ctf_organizers = _ctf_organizers.initModel(sequelize);
	const ctfs = _ctfs.initModel(sequelize);
	const ctfs_challenges = _ctfs_challenges.initModel(sequelize);
	const hints = _hints.initModel(sequelize);
	const messages = _messages.initModel(sequelize);
	const notification_users = _notification_users.initModel(sequelize);
	const notifications = _notifications.initModel(sequelize);
	const participations = _participations.initModel(sequelize);
	const profiles = _profiles.initModel(sequelize);
	const reports = _reports.initModel(sequelize);
	const sessions = _sessions.initModel(sequelize);
	const team_members = _team_members.initModel(sequelize);
	const teams = _teams.initModel(sequelize);
	const users = _users.initModel(sequelize);

	challenges_attachments.belongsTo(challenges, {
		foreignKey: 'challenge_id',
		targetKey: 'id',
	});
	challenges_attachments.belongsTo(attachments, {
		foreignKey: 'attachment_id',
		targetKey: 'id',
	});

	challenges.hasMany(challenges_attachments, {
		foreignKey: 'challenge_id',
		sourceKey: 'id',
		as: 'challenge_links',
	});
	attachments.hasMany(challenges_attachments, {
		foreignKey: 'attachment_id',
		sourceKey: 'id',
		as: 'attachment_links',
	});

	return {
		attachments: attachments,
		challenges: challenges,
		challenges_attachments: challenges_attachments,
		ctf_organizers: ctf_organizers,
		ctfs: ctfs,
		ctfs_challenges: ctfs_challenges,
		hints: hints,
		messages: messages,
		notification_users: notification_users,
		notifications: notifications,
		participations: participations,
		profiles: profiles,
		reports: reports,
		sessions: sessions,
		team_members: team_members,
		teams: teams,
		users: users,
	};
}
