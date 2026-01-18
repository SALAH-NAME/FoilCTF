import type { Sequelize } from 'sequelize';
import { attachments as _attachments } from './attachments.ts';
import type {
	attachmentsAttributes,
	attachmentsCreationAttributes,
} from './attachments.ts';
import { challenges as _challenges } from './challenges.ts';
import type {
	challengesAttributes,
	challengesCreationAttributes,
} from './challenges.ts';
import { challenges_attachments as _challenges_attachments } from './challenges_attachments.ts';
import type {
	challenges_attachmentsAttributes,
	challenges_attachmentsCreationAttributes,
} from './challenges_attachments.ts';
import { containers as _containers } from './containers.ts';
import type {
	containersAttributes,
	containersCreationAttributes,
} from './containers.ts';
import { ctf_organizers as _ctf_organizers } from './ctf_organizers.ts';
import type {
	ctf_organizersAttributes,
	ctf_organizersCreationAttributes,
} from './ctf_organizers.ts';
import { ctfs as _ctfs } from './ctfs.ts';
import type { ctfsAttributes, ctfsCreationAttributes } from './ctfs.ts';
import { ctfs_challenges as _ctfs_challenges } from './ctfs_challenges.ts';
import type {
	ctfs_challengesAttributes,
	ctfs_challengesCreationAttributes,
} from './ctfs_challenges.ts';
import { hints as _hints } from './hints.ts';
import type { hintsAttributes, hintsCreationAttributes } from './hints.ts';
import { messages as _messages } from './messages.ts';
import type {
	messagesAttributes,
	messagesCreationAttributes,
} from './messages.ts';
import { notification_users as _notification_users } from './notification_users.ts';
import type {
	notification_usersAttributes,
	notification_usersCreationAttributes,
} from './notification_users.ts';
import { notifications as _notifications } from './notifications.ts';
import type {
	notificationsAttributes,
	notificationsCreationAttributes,
} from './notifications.ts';
import { participations as _participations } from './participations.ts';
import type {
	participationsAttributes,
	participationsCreationAttributes,
} from './participations.ts';
import { profiles as _profiles } from './profiles.ts';
import type {
	profilesAttributes,
	profilesCreationAttributes,
} from './profiles.ts';
import { reports as _reports } from './reports.ts';
import type {
	reportsAttributes,
	reportsCreationAttributes,
} from './reports.ts';
import { sessions as _sessions } from './sessions.ts';
import type {
	sessionsAttributes,
	sessionsCreationAttributes,
} from './sessions.ts';
import { team_members as _team_members } from './team_members.ts';
import type {
	team_membersAttributes,
	team_membersCreationAttributes,
} from './team_members.ts';
import { teams as _teams } from './teams.ts';
import type { teamsAttributes, teamsCreationAttributes } from './teams.ts';
import { users as _users } from './users.ts';
import type { usersAttributes, usersCreationAttributes } from './users.ts';

export {
	_attachments as attachments,
	_challenges as challenges,
	_challenges_attachments as challenges_attachments,
	_containers as containers,
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
	containersAttributes,
	containersCreationAttributes,
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
	const containers = _containers.initModel(sequelize);
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

	return {
		attachments: attachments,
		challenges: challenges,
		challenges_attachments: challenges_attachments,
		containers: containers,
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
