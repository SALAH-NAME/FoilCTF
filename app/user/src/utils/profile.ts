import	express, {Response, NextFunction}	from 'express';
import	jwt					from 'jsonwebtoken';
import	{ AccessTokenSecret }			from './env';
import	{ profiles, users }			from '../db/schema';
import	{ db}					from './db';
import	{ eq }					from 'drizzle-orm';
import	bcrypt					from 'bcrypt';
import	path					from 'path';
import	multer, {FileFilterCallback}		from 'multer';
import	{
		User,
		Profile,
		AuthRequest
	}					from './types';
import	{
		getRandomNumber,
		isEmpty,
	}					from './utils';
import	{ AvatarsDir }				from './env';

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
		const	responseObject = {} as Profile;
		responseObject.username			= profile.username;
		responseObject.avatar			= profile.avatar;
		responseObject.challengessolved		= profile.challengessolved;
		responseObject.eventsparticipated	= profile.eventsparticipated;
		responseObject.totalpoints		= profile.totalpoints;
		if (profile.isprivate === false) { // public profile
			responseObject.bio		= profile.bio;
			responseObject.location		= profile.location;
			responseObject.socialmedialinks	= profile.socialmedialinks;
		}
		res.json(responseObject);
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
		cb(null, AvatarsDir); 
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
				if (req.user?.username !== req.params?.username) { // ownership check before uploading the file
					cb(new Error('Unauthorized'));
				}
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
		const	user = req.user;
		if (!user || user.id === undefined) {
			return res.sendStatus(400);
		}
		const	filename = `/api/profiles/${user.username}/avatar/` + file.filename;
		await db.update(profiles).set({avatar: filename}).where(eq(profiles.id, user.id));
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
		if (!req.body || !req.user || req.user.id === undefined) {
			return res.sendStatus(400);
		}
		const	authenticatedUsername	= req.user?.username;
		const	urlUsername		= req.params?.username;
		if (!authenticatedUsername || authenticatedUsername !== urlUsername) { // ownership check
			return res.sendStatus(403);
		}
		const	{email, password, ...profileData} = req.body;
		if (profileData.username || password || email) {
			const	userUpdate: any = {};
			if (profileData.username)	userUpdate.username	= profileData.username;
			if (email) 			userUpdate.email	= email;
			if (password)			userUpdate.password	= await bcrypt.hash(password, 10);
			await	db
				.update(users)
				.set(userUpdate)
				.where(eq(users.id, req.user.id));
		}
		if (profileData && !isEmpty(profileData)) {
			await	db.update(profiles).set(profileData).where(eq(profiles.id, req.user.id)); // "isprivate": "" to set the profile to private
		}
		return	res.sendStatus(200);
	} catch (err) {
		console.log(err);
		return res.sendStatus(500);
	}
}
