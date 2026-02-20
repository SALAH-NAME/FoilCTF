import express, { json as middleware_json } from 'express';
import middleware_cookies from 'cookie-parser';
import path from 'path';

import { AvatarsDir, PORT } from './utils/env';
import { middleware_error } from './error';
import {
	registerSchema,
	loginSchema,
	updateProfileSchema,
	updateUserSchema,
	sendFriendRequestSchema, // SECTION: friends
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
import { route_user_me } from './user';
import {
	sendFriendRequest,
	acceptFriendRequest,
	rejectFriendRequest,
	listFriends,
	listReceivedFriendRequests,
	removeFriend,
	cancelFriendRequest,
	notifyUser
} from './friend';
import {
	deleteUser,
	listUsers,
	updateUserRole
} from './admin'; // SECTION: admin

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
app.get(
	'/api/users/me',
	authenticateToken,
	route_user_me,
)
app.put(
	'/api/users/:username',
	parseNonExistingParam,
	middleware_schema_validate(updateUserSchema),
	authenticateToken,
	updateUser,
	updateTokens
);

// SECTION: admin
app.get(
	'/api/users',
	listUsers,
);
app.patch(
	'/api/users/:username',
	updateUserRole,
);
// app.put(
// 	'/api/users/:username',
// 	// banUser,
// );
app.delete(
	'/api/users/:username',
	deleteUser,
);

// SECTION: friends
app.get(
	'/api/friends',
	authenticateToken,
	listFriends,
);
app.get(
	'/api/friends/requests',
	authenticateToken,
	listReceivedFriendRequests,
);
app.post(
	'/api/friends/requests/:username', // which one? param or body?
	// middleware_schema_validate(sendFriendRequestSchema),
	authenticateToken,
	sendFriendRequest,
	notifyUser,
);
app.delete(
	'/api/friends/:id/requests/:requestID', // avoid for now
	authenticateToken,
	cancelFriendRequest,
);
app.patch(
	'/api/friends/requests/:username',
	authenticateToken,
	acceptFriendRequest,
	notifyUser,
);
app.delete(
	'/api/friends/requests/:username',
	authenticateToken,
	rejectFriendRequest,
);
app.delete(
	'/api/friends/:username',
	authenticateToken,
	removeFriend,
);




// SECTION: Health
app.get('/health', (_req, res) => {
	res.status(200).send('OK');
});

app.use(middleware_error);

if (!folder_exists(AvatarsDir))
	throw new Error(
		`Environment variable AVATARS_DIR="${AvatarsDir}" is not a valid path (doesn't exist, no permission, ...etc)"`
	);

app.listen(PORT, (err?: Error) => {
	if (!err) {
		console.log(`INFO :: SERVER :: Listening at ${PORT}`);
		return;
	}

	console.error(`ERROR :: SERVER :: An error has occurred during listen:`);
	console.error(err);
});
