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
	validate,
	authenticateToken,
	parseNonExistingParam,
	middleware_logger,
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

app.post('/api/auth/login', validate(loginSchema), route_auth_login);
app.post('/api/auth/register', validate(registerSchema), route_auth_register);
app.post('/api/auth/refresh', route_auth_refresh);
app.delete('/api/auth/logout', route_auth_logout);

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
	validate(updateProfileSchema),
	authenticateToken,
	updateProfile
);
app.put(
	'/api/users/:username',
	parseNonExistingParam,
	validate(updateUserSchema),
	authenticateToken,
	updateUser,
	updateTokens
);

app.use(middleware_error);
app.listen(PORT, () => {
	console.log(`app listening on port ${PORT}`);
});
