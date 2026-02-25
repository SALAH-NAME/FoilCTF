import ms from 'ms';
import path from 'node:path';
import { and, eq, or } from 'drizzle-orm';
import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';

import { db } from './utils/db';
import { sessions } from './db/schema';
import { UploadError } from './error';
import { profiles as table_profiles, friend_requests as table_friend_requests, friends as table_friends } from './db/schema';
import { AuthRequest, User } from './utils/types';
import { AccessTokenSecret } from './utils/env';
import { JWT_Payload, JWT_verify } from './jwt';
import { AvatarsDir, MaxFileSize, RefreshTokenExpiry } from './utils/env';
import {
	isEmpty,
	generateAccessToken,
	generateRefreshToken,
} from './utils/utils';

export const authenticateTokenProfile = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const header = req.get('authorization');
	if (header === undefined) return next();

	const [bearer, ...tokens] = header?.split(' ') ?? '';
	if (bearer !== 'Bearer' || tokens.length !== 1) return next();

	const token = tokens.join(' ');
	const token_user = JWT_verify<JWT_Payload>(token, AccessTokenSecret);
	if (!token_user) return next();

	res.locals.user = token_user;
	const req_username = req.params.username;
	if (typeof req_username !== 'string' || !req_username)
		return res.status(404).json({ error: 'Invalid request format' }).end();

	if (req_username !== token_user.username) return next(); // ownership check

	const [profile] = await db
		.select()
		.from(table_profiles)
		.where(eq(table_profiles.username, req_username));
	if (!profile) return res.status(404).json({ error: 'User has no profile attached' }).end();

	const res_data = {
		avatar: profile.avatar,
		username: profile.username,

		challenges_solved: profile.challengessolved,
		events_participated: profile.eventsparticipated,
		total_points: profile.totalpoints,

		bio: profile.bio,
		location: profile.location,
		social_media_links: profile.socialmedialinks,
	};
	return res.json(res_data);
};

export const getPublicProfile = async (req: Request, res: Response<any, { user?: JWT_Payload }>) => {
	const req_username = req.params.username;
	if (typeof req_username !== 'string' || !req_username)
		return res.status(404).json({ error: 'Invalid username' }).end();

	if (res.locals.user) {
		const { user } = res.locals;
		console.log(req_username, user);

		const on_friends = or(
			and(eq(table_friends.username_1, table_profiles.username), eq(table_friends.username_2, user.username)),
			and(eq(table_friends.username_2, table_profiles.username), eq(table_friends.username_1, user.username)),
		);
		const on_friend_requests = or(
			eq(table_friend_requests.sender_name, table_profiles.username),
			eq(table_friend_requests.receiver_name, table_profiles.username),
		);

		const [row] = await db
					.select({ profile: table_profiles, friendship: table_friends, request: table_friend_requests })
					.from(table_profiles)
					.leftJoin(table_friends, on_friends)
					.leftJoin(table_friend_requests, on_friend_requests)
					.where(eq(table_profiles.username, req_username));
		if (!row)
			return res.status(404).json({ error: 'User profile doesn\' exist' }).end();

		const { request, friendship, profile } = row;
		const friend_status = ((request, friendship) => {
			console.log('Friendship:', friendship);
			if (friendship)
				return 'friends';
			if (request) {
				if (request?.sender_name === res.locals.user?.username)
					return 'sent';
				return 'received';
			}
			return 'none';
		})(request, friendship);
		const data = {
			friend_status,

			avatar: profile.avatar,
			username: profile.username,

			challenges_solved: profile.challengessolved,
			events_participated: profile.eventsparticipated,
			total_points: profile.totalpoints,

			bio: profile.isprivate ? undefined : profile.bio,
			location: profile.isprivate ? undefined : profile.location,
			social_media_links: profile.isprivate
				? undefined
				: profile.socialmedialinks,
		};
		return res.status(200).json(data).end();
	}

	const [profile] = await db
			.select()
			.from(table_profiles)
			.where(eq(table_profiles.username, req_username));
	if (!profile)
		return res.status(404).json({ error: "User profile doesn't exist" }).end();

	const res_data = {
		friend_status: 'none',

		avatar: profile.avatar,
		username: profile.username,

		challenges_solved: profile.challengessolved,
		events_participated: profile.eventsparticipated,
		total_points: profile.totalpoints,

		bio: profile.isprivate ? undefined : profile.bio,
		location: profile.isprivate ? undefined : profile.location,
		social_media_links: profile.isprivate
			? undefined
			: profile.socialmedialinks,
	};
	return res.status(200).json(res_data).end();
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
	storage,

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
	const file = req.file;
	if (!file)
		return res.status(400).json({ error: 'File too large' }).end();

	const user = res.locals.user;
	if (!user || user.id === undefined)
		return res.status(401).json({ error: 'Unauthorized' }).end();

	const dbFilename = `/api/profiles/${user.username}/avatar/` + file.filename;
	await db
		.update(table_profiles)
		.set({ avatar: dbFilename })
		.where(eq(table_profiles.id, user.id));
	return res.status(201).json({ ok: true }).end()
};

export const updateTokens = async (
	_req: Request,
	res: Response<any, { user: User }>
) => {
	const { username, role, id } = res.locals.user;

	const token_access = generateAccessToken(username, role, id);
	const token_refresh = generateRefreshToken(username, id);
	const expiry_date = new Date(Date.now() + ms(RefreshTokenExpiry));

	await db
		.update(sessions)
		.set({
			refreshtoken: token_refresh,
			expiry: expiry_date.toISOString(),
		})
		.where(eq(sessions.user_id, id));

	return res
		.status(200)
		.json({ token_access, token_refresh, expiry: expiry_date.toISOString() })
		.end();
};

export const updateProfile = async (
	req: Request,
	res: Response<any, { user?: User }>
) => {
	const profileData = req.body;
	if (!profileData || !res.locals.user)
		return res.status(400).json({ error: 'Invalid request format' }).end();

	const { user } = res.locals;
	if (user.username !== req.params.username)
		return res.status(403).json({ error: 'Unauthorized' }).end();

	if (!isEmpty(profileData)) {
		const result = await db
			.update(table_profiles)
			.set(profileData)
			.where(eq(table_profiles.username, user.username)); // "isprivate": "" to set the profile to private
		if (result.rowCount === 0)
			return res
				.status(404)
				.json({ error: 'User profile was not found' })
				.end();
	}
	return res.status(200).json({ ok: true }).end();
};
