import path from 'node:path';
import { eq } from 'drizzle-orm';
import { hash } from 'bcrypt';
import middleware_cors from 'cors';
import express, { json as middleware_json } from 'express';

import { middleware_error } from './error';
import { AvatarsDir, PORT } from './utils/env';
import { db, pool } from './utils/db';
import {
	registerSchema,
	loginSchema,
	updateProfileSchema,
	updateUserSchema,
	teamCreationSchema,
	updateTeamSchema,
	transferLeadershipSchema,
	FoilCTF_Success,
} from './utils/types';
import {
	authenticateToken as middleware_auth,
	parseNonExistingParam,
	middleware_logger,
	middleware_schema_validate,
	folder_exists,
	middleware_auth_optional,
} from './utils/utils';
import {
	getPublicProfile,
	authenticateTokenProfile,
	updateProfile,
	uploadAvatar,
	upload,
	updateTokens,
} from './profile';

import {
	route_oauth_42_connect,
	route_oauth_42_link,
	route_oauth_42_verify,
} from './routes/oauth';

import {
	route_auth_register,
	route_auth_login,
	route_auth_refresh,
	route_auth_logout,
	SALT_ROUNDS,
} from './auth';
import {
	route_user_list,
	route_user_me,
	route_user_me_requests,
	route_user_update,
} from './user';
import {
	createTeam,
	getTeamDetails,
	getTeamMembers,
	leaveTeam,
	deleteMember,
	handOverLeadership,
	getTeams,
	updateTeam,
	sendJoinRequest,
	cancelJoinRequest,
	acceptJoinRequest,
	declineJoinRequest,
	route_team_requests,
	notifyAllMembers,
	notifyCaptain,
	route_team_delete,
} from './team';
import {
	sendFriendRequest,
	acceptFriendRequest,
	rejectFriendRequest,
	listFriends,
	listFriendRequests,
	removeFriend,
	cancelFriendRequest,
	notifyUser,
} from './friend';
import { route_metrics } from './routes/metrics';
import { users } from './db/schema';

const app = express();
app.use(middleware_cors());
app.use(middleware_logger);
app.use(middleware_json());

// SECTION: Authentication
app.post(
	'/api/auth/login',
	middleware_schema_validate(loginSchema),
	route_auth_login
);
app.post(
	'/api/auth/register',
	middleware_schema_validate(registerSchema),
	route_auth_register
);
app.post('/api/auth/refresh', route_auth_refresh);
app.delete('/api/auth/logout', route_auth_logout);

// SECTION: Profiles
app.get(
	'/api/profiles/:username',
	parseNonExistingParam,
	authenticateTokenProfile,
	getPublicProfile
);
app.post(
	'/api/profiles/:username/avatar',
	parseNonExistingParam,
	middleware_auth,
	upload.single('avatar'),
	uploadAvatar
);
app.use(
	'/api/profiles/:username/avatar',
	express.static(path.resolve(AvatarsDir), {
		dotfiles: 'deny',
		index: false,
		redirect: false,
	})
);
app.put(
	'/api/profiles/:username',
	parseNonExistingParam,
	middleware_schema_validate(updateProfileSchema),
	middleware_auth,
	updateProfile
);

// SECTION: OAuth
app.get('/api/oauth/42/link', middleware_auth, route_oauth_42_link);
app.get('/api/oauth/42/connect', route_oauth_42_connect);
app.get('/api/oauth/42/link/verify', route_oauth_42_verify('link'));
app.get('/api/oauth/42/connect/verify', route_oauth_42_verify('connect'));

// SECTION: Users
app.get('/api/users', middleware_auth_optional, route_user_list); // TODO(xenobas): Continue implementing optional authentication
app.get('/api/users/me', middleware_auth, route_user_me);
app.get('/api/users/me/requests', middleware_auth, route_user_me_requests);
app.put(
	'/api/users/:username',
	parseNonExistingParam,
	middleware_schema_validate(updateUserSchema),
	middleware_auth,
	route_user_update,
	updateTokens
);

// SECTION: Friends
app.get('/api/friends', middleware_auth, listFriends);
app.get('/api/friends/requests', middleware_auth, listFriendRequests);
app.post(
	'/api/friends/requests/:username',
	middleware_auth,
	sendFriendRequest,
	notifyUser
);
app.delete(
	'/api/friends/requests/:username',
	middleware_auth,
	cancelFriendRequest
);
app.patch(
	'/api/friends/requests/pending/:username',
	middleware_auth,
	acceptFriendRequest,
	notifyUser
);
app.delete(
	'/api/friends/requests/pending/:username',
	middleware_auth,
	rejectFriendRequest
);
app.delete('/api/friends/:username', middleware_auth, removeFriend);

// SECTION: Teams
app.get('/api/teams', getTeams);

// SECTION: Health
app.get('/health', (_req, res) => {
	return res.status(200).json(new FoilCTF_Success('OK', 200));
});
app.get('/metrics', route_metrics);

app.get('/api/teams', getTeams);
app.get('/api/teams/:team_name', getTeamDetails);
app.put(
	'/api/teams',
	middleware_auth,
	middleware_schema_validate(updateTeamSchema),
	updateTeam
);
app.post(
	'/api/teams',
	middleware_schema_validate(teamCreationSchema),
	middleware_auth,
	createTeam
);
app.delete('/api/teams/:team_name', middleware_auth, route_team_delete);

// SECTION: Team membership
app.get(
	'/api/teams/:team_name/members',
	getTeamMembers // public data
);
app.put(
	'/api/teams/:team_name/crown',
	middleware_schema_validate(transferLeadershipSchema),
	middleware_auth,
	handOverLeadership,
	notifyCaptain
);
app.delete(
	'/api/teams/:team_name/members/me',
	middleware_auth,
	leaveTeam,
	notifyAllMembers
);
app.delete(
	'/api/teams/:team_name/members/:username',
	middleware_auth,
	deleteMember,
	notifyAllMembers
);

// SECTION: Team requests
app.get(
	'/api/teams/:team_name/requests', // !!!!!!!!!!! conflicts with /api/teams/:team_name, getTeamDetails
	middleware_auth,
	route_team_requests
);
app.post(
	'/api/teams/:team_name/requests',
	middleware_auth,
	sendJoinRequest,
	notifyCaptain
);
app.put(
	'/api/teams/:team_name/requests/:username',
	middleware_auth,
	acceptJoinRequest,
	notifyAllMembers
);
app.delete(
	'/api/teams/:team_name/requests',
	middleware_auth,
	cancelJoinRequest
);
app.delete(
	'/api/teams/:team_name/requests/:username',
	middleware_auth,
	declineJoinRequest
);

// SECTION: Health
app.get('/health', (_req, res) => {
	return res.status(200).json(new FoilCTF_Success('OK', 200));
});

app.use(middleware_error);

if (!folder_exists(AvatarsDir))
	throw new Error(
		`Environment variable AVATARS_DIR="${AvatarsDir}" is not a valid path (doesn't exist, no permission, ...etc)"`
	);

async function ensure_user_admin() {
	const { FOILCTF_ADMIN_USERNAME, FOILCTF_ADMIN_PASSWORD } = process.env;
	if (typeof FOILCTF_ADMIN_USERNAME !== 'string' || !FOILCTF_ADMIN_USERNAME)
		throw new Error(
			'Please provide an FOILCTF_ADMIN_USERNAME environment variable'
		);
	if (typeof FOILCTF_ADMIN_PASSWORD !== 'string' || !FOILCTF_ADMIN_PASSWORD)
		throw new Error(
			'Please provide an FOILCTF_ADMIN_PASSWORD environment variable'
		);

	const password = await hash(FOILCTF_ADMIN_PASSWORD, SALT_ROUNDS);

	const is_created = await db.transaction(async (tx) => {
		const rows = await tx
			.select()
			.from(users)
			.where(eq(users.username, FOILCTF_ADMIN_USERNAME));
		if (rows.length !== 0) return false;

		const row = {
			username: FOILCTF_ADMIN_USERNAME,
			role: 'admin',
			email: 'admin@foilctf.ma',
			password,
		};
		await tx.insert(users).values(row);
		return true;
	});

	if (is_created)
		console.log(
			"INFO :: SERVER :: Admin user '%s' has been created",
			FOILCTF_ADMIN_USERNAME
		);
	else
		console.log(
			"INFO :: SERVER :: Admin user '%s' already exists",
			FOILCTF_ADMIN_USERNAME
		);
}

const server = app.listen(PORT, async (err?: Error) => {
	if (!err) {
		console.log(`INFO :: SERVER :: Listening at ${PORT}`);
		await ensure_user_admin();

		return;
	}

	console.error(`ERROR :: SERVER :: An error has occurred during listen:`);
	console.error(err);
});

const gracefulShutdown = (signal: string) => {
	console.log(`Received ${signal}, shutting down gracefully...`);

	const forceTimer = setTimeout(() => {
		console.error(
			'Could not close connections in time, forcefully shutting down'
		);
		process.exit(1);
	}, 10000);

	server.close(async (err) => {
		if (err) {
			console.error('Error closing HTTP server:', err);
		} else {
			console.log('HTTP server closed.');
		}

		try {
			await pool.end();
			console.log('Database connection closed.');
			clearTimeout(forceTimer);
			process.exit(err ? 1 : 0);
		} catch (dbErr) {
			console.error('Error closing database connection:', dbErr);
			process.exit(1);
		}
	});
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
