import path from 'node:path';
import bcrypt from 'bcrypt';
import orm from 'drizzle-orm';
import ms, { StringValue } from 'ms';
import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';

import { AccessTokenSecret } from './utils/env';
import { profiles, users } from './db/schema';
import { db } from './utils/db';
import { Profile, AuthRequest } from './utils/types';
import {
	isEmpty,
	generateAccessToken,
	password_validate,
	user_exists,
	generateRefreshToken,
} from './utils/utils';
import { AvatarsDir, MaxFileSize, RefreshTokenExpiry } from './utils/env';
import { sessions } from './db/schema';
import { UploadError } from './error';

export const authenticateTokenProfile = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authHeader = req.get('authorization');
		if (authHeader === undefined) return next();
		const [bearer, ...tokens] = authHeader?.split(' ') ?? '';
		if (bearer !== 'Bearer' || tokens.length != 1) return next();

		const decoded = jwt.verify(
			tokens[0] ?? '',
			AccessTokenSecret
		) as JwtPayload;
		const requestedUsername = req.params?.username as string;
		if (decoded.username !== requestedUsername) return next(); // ownership check
		const [profile] = await db
			.select()
			.from(profiles)
			.where(orm.eq(profiles.username, requestedUsername));

		if (!profile) return res.sendStatus(404);
		const { avatar, id, ...data } = profile;
		return res.json(data);
	} catch (err) {
		if (err instanceof TokenExpiredError) return next();
		console.error(err);
		res.sendStatus(500);
	}
};

export const getPublicProfile = async (req: Request, res: Response) => {
	try {
		const requestedUsername = req.params?.username as string;

		const [profile] = await db
			.select()
			.from(profiles)
			.where(orm.eq(profiles.username, requestedUsername));

		if (!profile) return res.sendStatus(404);
		const responseObject = {} as Profile;
		responseObject.username = profile.username;
		responseObject.challengessolved = profile.challengessolved;
		responseObject.eventsparticipated = profile.eventsparticipated;
		responseObject.totalpoints = profile.totalpoints;
		if (profile.isprivate === false) {
			// public profile
			responseObject.bio = profile.bio;
			responseObject.location = profile.location;
			responseObject.socialmedialinks = profile.socialmedialinks;
		}
		return res.json(responseObject);
	} catch (err) {
		console.log(err);
		return res.sendStatus(500);
	}
};

const storage = multer.diskStorage({
	destination: AvatarsDir,
	filename: (
		req: AuthRequest,
		file: Express.Multer.File,
		cb: (error: Error | null, destination: string) => void
	) => {
		cb(null, req.user?.username + path.extname(file.originalname)); // username.png/jpeg
	},
});

function fileFilterAdapter(
	filter: (req: AuthRequest, file: Express.Multer.File) => boolean
) {
	return (
		req: AuthRequest,
		file: Express.Multer.File,
		callback: FileFilterCallback
	) => {
		try {
			const value = filter(req, file);
			callback(null, value);
		} catch (err) {
			if (err instanceof Error) return callback(err);
			return callback(new Error(`${err}`));
		}
	};
}

export const upload = multer({
	storage: storage,
	limits: { fileSize: MaxFileSize },
	fileFilter: fileFilterAdapter(
		(req: AuthRequest, file: Express.Multer.File) => {
			if (req.user?.username !== req.params?.username) {
				// ownership check before uploading the file
				throw new UploadError('unauthorized');
			}

			if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png') {
				throw new UploadError('file-type-invalid');
			}

			return true;
		}
	),
});

export const uploadAvatar = async (req: Request, res: Response) => {
	try {
		const file = req.file;
		if (!file) {
			return res.sendStatus(400); // no file | file too large
		}
		console.log(`received ${file.filename}, size: ${file.size} bytes`);
		const user = res.locals.user;
		if (!user || user.id === undefined) {
			return res.sendStatus(400);
		}
		const dbFilename = `/api/profiles/${user.username}/avatar/` + file.filename;
		await db
			.update(profiles)
			.set({ avatar: dbFilename })
			.where(orm.eq(profiles.id, user.id));
		return res.sendStatus(201);
	} catch (err) {
		console.error(err);
		res.sendStatus(500);
	}
};

export const updateProfile = async (req: Request, res: Response) => {
	const profileData = req.body;
	if (!profileData || !res.locals.user) {
		return res.status(400).send();
	}
	if (res.locals.user?.username !== req.params?.username) {
		// ownership check
		return res.sendStatus(401);
	}

	if (!isEmpty(profileData)) {
		await db
			.update(profiles)
			.set(profileData)
			.where(orm.eq(profiles.id, res.locals.user.id)); // "isprivate": "" to set the profile to private
	}
	res.status(200).send();
};

export const updateUser = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	if (!req.body || !res.locals.user) {
		return res.status(400).send();
	}
	if (res.locals.user?.username !== req.params?.username) {
		// ownership check
		return res.sendStatus(403);
	}

	let { username, email, oldPassword, newPassword } = req.body;

	const existingUser = await user_exists(username, email);
	if (existingUser) {
		return res.sendStatus(409);
	}

	if (newPassword !== undefined) {
		const passwordIsValid = await password_validate(
			oldPassword,
			res.locals.user.username
		);
		if (!passwordIsValid) return res.status(401).send('Invalid password');
		newPassword = await bcrypt.hash(newPassword, 10);
	}

	if (username || email || newPassword) {
		await db
			.update(users)
			.set({
				username: username,
				email: email,
				password: newPassword,
			})
			.where(orm.eq(users.id, res.locals.user.id));
	}
	next();
};

export const updateTokens = async (
	_req: Request,
	res: Response,
	next: NextFunction
) => {
	res.clearCookie('jwt', {
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
	});

	const user = res.locals?.user;
	const accessToken = generateAccessToken(
		user.username as any,
		user.role,
		user.id
	);
	const refreshToken = generateRefreshToken(user.username as any, user.id);
	const duration = ms(RefreshTokenExpiry as StringValue);
	const expiryDate = new Date(Date.now() + duration);

	await db
		.update(sessions)
		.set({
			refreshtoken: refreshToken,
			expiry: expiryDate.toISOString(),
		})
		.where(orm.eq(sessions.userId, user.id));

	res.cookie('jwt', refreshToken, {
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		maxAge: duration,
	});
	res.json({ accessToken: accessToken, refreshToken: refreshToken });

	next();
};
