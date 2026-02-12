import express, {
	json as middleware_json,
	type Request,
	type Response,
	type NextFunction,
} from 'express';
import { PORT } from './utils/env';
import { ZodError } from 'zod';
import middleware_cookies from 'cookie-parser';
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
import { register, login, refresh, logout } from './userAuth';

import multer from 'multer';

const app = express();
app.use(middleware_json());
app.use(middleware_cookies());

app.post('/api/auth/register', validate(registerSchema), register);
app.post('/api/auth/login', validate(loginSchema), login);
app.post('/api/auth/refresh', refresh);
app.delete('/api/auth/logout', logout);

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

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
	if (err instanceof ZodError) {
		return res.status(400).send(err.message);
	}
	if (err instanceof multer.MulterError) {
		return res.status(400).send(err.message);
	}
	if (err instanceof SyntaxError) {
		return res.status(400).send(err.message);
	}
	if (err.message === 'Invalid file type') {
		return res.status(400).send('Only images of type png/jpeg are allowed');
	}
	if (err.message === 'Unauthorized') {
		return res.status(401).send('Unauthorized');
	}
	console.error(err);
	res.sendStatus(500);
});

app.listen(PORT, () => {
	console.log(`app listening on port ${PORT}`);
});
