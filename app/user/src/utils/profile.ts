import	express, {Response, NextFunction}	from 'express';
import	jwt					from 'jsonwebtoken';
import	{ AccessTokenSecret }			from './env';
import	{ profiles, users }			from '../db/schema';
import	{ db}					from './db';
import	{ eq }					from 'drizzle-orm';
import	multer, {FileFilterCallback}		from 'multer';
import	{
		User,
		Profile,
		AuthRequest
	}					from './types';
import	{
		getRandomNumber,
	}					from './utils';

const	selectProfile = async (req: AuthRequest, res: Response) => {
	const	requestedUsername = req.params.username as string;
	if (!requestedUsername) { 
		res.sendStatus(400);
		return (null);
	}
	const	[profile]	= await db.select()
					.from(profiles)
					.where(eq(profiles.username, requestedUsername));
	if (!profile) {
		res.sendStatus(404);
		return (null);
	}
	return	(profile);
}

export	const	authenticateTokenProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const	authHeader = req.get('authorization');
		if (authHeader === undefined) {
			throw new Error();
		}
		const	[bearer, token]	= authHeader.split(' ');
		if (bearer !== 'Bearer' || !token) {
			throw new Error();
		}
		const	decoded = jwt.verify(token, AccessTokenSecret) as User;
		req.user = decoded;
		next();
	} catch (err) {
		const	profile = await selectProfile(req, res) as Profile;
		res.json({
				username:		profile.username,
				avatar:			profile.avatar,
				challengessolved:	profile.challengessolved,
				eventsparticipated:	profile.eventsparticipated,
				totalpoints:		profile.totalpoints,
				bio:			profile.bio,
				location:		profile.location,
				socialmedialinks:	profile.socialmedialinks,
			});
	}
}

export	const	getProfile = async (req: AuthRequest, res: Response) => {
	try {
		const	profile = await selectProfile(req, res);
		res.json(profile);
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
}

const	storage = multer.diskStorage({
	destination: (
		req:	AuthRequest,
		file:	Express.Multer.File,
		cb: (error: Error | null, destination: string) => void
	) => {
		cb(null, './uploads/avatars/'); // .env variable?
	},
	filename: (
		req:	AuthRequest,
		file:	Express.Multer.File,
		cb: (error: Error | null, destination: string) => void
	) => {
		const	uniquePrefix = Date.now() + '-' + getRandomNumber(0, 999_999);
		cb(null,  uniquePrefix + file.originalname);
	}
});

export	const	upload = multer({
	storage:	storage,
	limits:		{fileSize:	2 * 1024 * 1024}, // 2MB
	fileFilter:	(
			req:	AuthRequest,
			file:	Express.Multer.File,
			cb:	FileFilterCallback
			) => {
				if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
					cb(null, true);
				} else {
					cb(new Error('Invalid file type'));
				}
			}
});

export	const	uploadAvatar = async (req: AuthRequest, res: Response) => {
	try {
		const	file = req.file;
		if (!file) {
			return res.sendStatus(400); // no file | file too large
		}
		console.log(`received ${file.filename}, size: ${file.size} bytes`);
		const	user = req.user as User;
		const	filename = "./uploads/avatars/" + file.filename; // env variable?
		await db.update(profiles).set({avatar: filename}).where(eq(profiles.username, user.username));
		return res.send({
			message:	"Avatar uploaded successfully",
			filename:	file.originalname
			});
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
}

export	const	updateProfile = async (req: AuthRequest, res: Response) => {
	try {
		const	updateData	= req.body;
		if (!req.body) {
			return res.sendStatus(400);
		}
		const	username	= req.user?.username;
		if (!username) {
			return res.sendStatus(401);
		}
		console.log(`object received: `, req.body);
		console.log(`from ${username}`);
		const	{password, email, ...restOfBody} = req.body;
		const	updatePayload	= { ...restOfBody };
		if (updatePayload.username || password || email) {
			await	db
				.update(users)
				.set({
					username:	updatePayload.username,
					password:	password,
					email:		email,
				})
				.where(eq(users.username, username));
		}
		await	db.update(profiles).set(updatePayload).where(eq(profiles.username, username));
		return	res.sendStatus(200);
	} catch (err) {
		console.log(err);
		return res.sendStatus(500);
	}
}
