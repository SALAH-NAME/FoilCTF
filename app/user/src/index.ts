import express, { json as middleware_json } from 'express';
import middleware_cookies from 'cookie-parser';

import { PORT } from './utils/env';
import { middleware_error } from './error';
import {
	registerSchema,
	loginSchema,
	updateProfileSchema,
	updateUserSchema,
} from './utils/types';
import {
	authenticateToken,
	parseNonExistingParam,
	middleware_logger,
	middleware_schema_validate,
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

const app = express();
app.use(middleware_logger);
app.use(middleware_json());
app.use(middleware_cookies());

// SECTION: Authentication
app.post('/api/auth/login', middleware_schema_validate(loginSchema), route_auth_login);
app.post('/api/auth/register', middleware_schema_validate(registerSchema), route_auth_register);
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
app.put(
	'/api/profiles/:username',
	parseNonExistingParam,
	middleware_schema_validate(updateProfileSchema),
	authenticateToken,
	updateProfile
);

// SECTION: Users
app.put(
	'/api/users/:username',
	parseNonExistingParam,
	middleware_schema_validate(updateUserSchema),
	authenticateToken,
	updateUser,
	updateTokens
);

app.use(middleware_error);

app.listen(PORT, (err?: Error) => {
	if (!err) {
		console.log(`INFO :: SERVER :: Listening at ${PORT}`);
		return ;
	}

	console.error(`ERROR :: SERVER :: An error has occurred during listen:`);
	console.error(err);
});
