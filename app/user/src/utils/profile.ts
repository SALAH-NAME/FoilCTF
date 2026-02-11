import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import { AccessTokenSecret } from './env';
import { profiles, users } from '../db/schema';
import { db } from './db';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import path from 'path';
import multer, { FileFilterCallback } from 'multer';
import { User, Profile, AuthRequest } from './types';
import { getRandomNumber, isEmpty } from './utils';
import { AvatarsDir, MaxFileSize } from './env';

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
		if (decoded.username !== requestedUsername) return next();
		const [profile] = await db
			.select()
			.from(profiles)
			.where(eq(profiles.username, requestedUsername));

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
			.where(eq(profiles.username, requestedUsername));

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
	destination: (
		req: AuthRequest, // can't get the user otherwise
		file: Express.Multer.File,
		cb: (error: Error | null, destination: string) => void
	) => {
		cb(null, AvatarsDir);
	},
	filename: (
		req: AuthRequest,
		file: Express.Multer.File,
		cb: (error: Error | null, destination: string) => void
	) => {
		cb(null, req.user?.username + path.extname(file.originalname)); // username.png/jpeg
	},
});

export const upload = multer({
	storage: storage,
	limits: { fileSize: MaxFileSize },
	fileFilter: (
		req: AuthRequest, // can't get the user otherwise
		file: Express.Multer.File,
		cb: FileFilterCallback
	) => {
		console.log('req user username: ', req.user?.username);
		console.log('req params username: ', req.params?.username);
		if (req.user?.username !== req.params?.username) {
			// ownership check before uploading the file
			cb(new Error('Unauthorized'));
		} else if (
			file.mimetype !== 'image/jpeg' &&
			file.mimetype !== 'image/png'
		) {
			cb(new Error('Invalid file type'));
		} else {
			cb(null, true);
		}
	},
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
		const filename = `/api/profiles/${user.username}/avatar/` + file.filename;
		await db
			.update(profiles)
			.set({ avatar: filename })
			.where(eq(profiles.id, user.id));
		return res.sendStatus(201);
	} catch (err) {
		console.error(err);
		res.sendStatus(500);
	}
};

export const updateUser = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	if (!req.body || !res.locals.user) {
		return res.sendStatus(400);
	}
	if (res.locals.user?.username !== req.params?.username) {
		// ownership check
		return res.sendStatus(403);
	}

	let { username, email, password, ...profileData } = req.body;
	if (username || email || password) {
		const [existingUser] = await db
			.select()
			.from(users)
			.where(or(eq(users.username, username), eq(users.email, email)));
		if (existingUser) {
			return res.sendStatus(409);
		}

		if (password) password = await bcrypt.hash(password, 10);
		await db
			.update(users)
			.set({
				username: username,
				email: email,
				password: password,
			})
			.where(eq(users.id, res.locals.user.id));
	}
	next();
};

export const updateProfile = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { email, password, ...profileData } = req.body;
	if (!isEmpty(profileData)) {
		await db
			.update(profiles)
			.set(profileData)
			.where(eq(profiles.id, res.locals.user.id)); // "isprivate": "" to set the profile to private
	}
	return res.sendStatus(200);
};
