import express, { json as middleware_json } from 'express';
import middleware_cookies from 'cookie-parser';
import path from 'path';

import { AvatarsDir, PORT } from './utils/env';
import { middleware_error } from './error';
import { pool } from './utils/db';
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
	authenticateToken,
	parseNonExistingParam,
	middleware_logger,
	middleware_schema_validate,
	folder_exists,
} from './utils/utils';
import {
	getPublicProfile,
	authenticateTokenProfile,
	updateUser,
	updateProfile,
	uploadAvatar,
	upload,
	updateTokens,
} from './profile';
import {
	route_auth_register,
	route_auth_login,
	route_auth_refresh,
	route_auth_logout,
} from './auth';
import {
	createTeam,
	getTeamDetails,
	getTeamMembers,
	leaveTeam,
	deleteMember,
	handOverLeadership,
	sendJoinRequest,
	cancelJoinRequest,
	acceptJoinRequest,
	declineJoinRequest,
	getSentRequests,
	notifyAllMembers,
	notifyCaptain,
	updateTeam,
	getTeams,
	getReceivedRequests,
} from './team';
import { route_user_me } from './user';
import {
	sendFriendRequest,
	acceptFriendRequest,
	rejectFriendRequest,
	listFriends,
	listReceivedFriendRequests,
	removeFriend,
	cancelFriendRequest,
	notifyUser,
} from './friend';
import { route_metrics } from './routes/metrics';

const app = express();
app.use(middleware_logger);
app.use(middleware_json());
app.use(middleware_cookies());

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
	authenticateToken,
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
	authenticateToken,
	updateProfile
);

// SECTION: Users
app.get('/api/users/me', authenticateToken, route_user_me);
app.put(
	'/api/users/:username',
	parseNonExistingParam,
	middleware_schema_validate(updateUserSchema),
	authenticateToken,
	updateUser,
	updateTokens
);

// SECTION: friends
app.get('/api/friends', authenticateToken, listFriends);
app.get('/api/friends/requests', authenticateToken, listReceivedFriendRequests);
app.post(
	'/api/friends/requests/:username',
	authenticateToken,
	sendFriendRequest,
	notifyUser
);
app.delete(
	'/api/friends/requests/:username',
	authenticateToken,
	cancelFriendRequest
);
app.patch(
	'/api/friends/requests/pending/:username',
	authenticateToken,
	acceptFriendRequest,
	notifyUser
);
app.delete(
	'/api/friends/requests/pending/:username',
	authenticateToken,
	rejectFriendRequest
);
app.delete('/api/friends/:username', authenticateToken, removeFriend);

// SECTION: Health
app.get('/health', (_req, res) => {
	return res.status(200).json(new FoilCTF_Success('OK', 200));
});
app.get('/metrics', route_metrics);

// SECTION: Teams
app.post(
	'/api/teams/',
	middleware_schema_validate(teamCreationSchema),
	authenticateToken,
	createTeam
);
app.get(
	'/api/teams/:teamName',
	getTeamDetails // public data
);
app.get(
	'/api/teams/:teamName/members',
	getTeamMembers // public data
);
app.delete(
	'/api/teams/:teamName/members',
	authenticateToken,
	leaveTeam,
	notifyAllMembers
);
app.delete(
	'/api/teams/:teamName/members/:username',
	authenticateToken,
	deleteMember,
	notifyAllMembers
);
app.put(
	'/api/teams/:teamName/captain',
	middleware_schema_validate(transferLeadershipSchema),
	authenticateToken,
	handOverLeadership,
	notifyCaptain
);
app.post(
	'/api/teams/:teamName',
	authenticateToken,
	sendJoinRequest,
	notifyCaptain
);
app.delete('/api/teams/:teamName', authenticateToken, cancelJoinRequest);
app.put(
	'/api/teams/:teamName/requests/:username',
	authenticateToken,
	acceptJoinRequest,
	notifyAllMembers
);
app.delete(
	'/api/teams/:teamName/requests/:username',
	authenticateToken,
	declineJoinRequest
);
app.get(
	'/api/teams/:teamName/requests', // teamName is redundant! ( '/api/user/requests' ? )
	authenticateToken,
	getSentRequests
);
app.put(
	'/api/teams',
	middleware_schema_validate(updateTeamSchema),
	authenticateToken,
	updateTeam
);
app.get('/api/teams', getTeams);
app.get(
	'/api/requests', // !!!!!!!!!!! conflicts with /api/teams/:teamName, getTeamDetails
	authenticateToken,
	getReceivedRequests
);

app.use(middleware_error);

if (!folder_exists(AvatarsDir))
	throw new Error(
		`Environment variable AVATARS_DIR="${AvatarsDir}" is not a valid path (doesn't exist, no permission, ...etc)"`
	);

const server = app.listen(PORT, (err?: Error) => {
	if (!err) {
		console.log(`INFO :: SERVER :: Listening at ${PORT}`);
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
