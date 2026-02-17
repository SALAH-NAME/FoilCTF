import { Request } from 'express';
import { users, sessions, profiles } from '../db/schema';
import { boolean, object, z } from 'zod';

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Profile = typeof profiles.$inferSelect;

export interface Post {
	username: string;
	title: string;
}

export interface AuthRequest extends Request {
	user?: User;
}

export class FoilCTF_error extends Error {
	public statusCode: number;
	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;

		this.name = 'FoilCTF_error';
	}
}

const PASSWORD_MIN_CHARACTERS = 8;
const PASSWORD_MAX_CHARACTERS = 64;

export const registerSchema = z.object({
	body: z.object({
		username: z
			.string()
			.min(3)
			.max(15)
			.regex(/^[a-zA-Z0-9_-]+$/), // add '-', so yait-nas is valid
		email: z.email(),
		password: z.string().min(PASSWORD_MIN_CHARACTERS).max(PASSWORD_MAX_CHARACTERS),
	}),
});

export const loginSchema = z.object({
	// same here
	body: z.object({
		username: z
			.string()
			.min(3)
			.max(15)
			.regex(/^[a-zA-Z0-9_-]+$/), // same here
		password: z.string(),
	}),
});

const userBody = z.object({
	username: z
		.string()
		.min(3)
		.max(15)
		.regex(/^[a-zA-Z0-9_-]+$/), // add '-', so yait-nas is valid
	email: z.email(),
	newPassword: z.string().min(PASSWORD_MIN_CHARACTERS).max(PASSWORD_MAX_CHARACTERS),
	oldPassword: z.string(),
});

export const updateUserSchema = z.object({
	body: userBody.partial(),
});

const profileBody = z.object({
	bio: z.string().trim().max(500),
	location: z.string().trim().max(50),
	socialmedia: z.url(),
	isprivate: z.coerce.boolean(),
});

export const updateProfileSchema = z.object({
	body: profileBody.partial(),
});

export const teamCreationSchema = z.object({
	body: z.object({
		name:	z
			.string()
			.min(3)
			.max(15)
			.regex(/^[a-zA-Z0-9_-]+$/),
	}),
});

export const updateTeamSchema = z.object({
	body: z.object({
		isLocked: z.coerce.boolean().optional(),
		description: z.string().max(500).optional(),
	}),
});

export const transferLeadershipSchema = z.object({
	body: z.object({
		username: z
		.string()
		.min(3)
		.max(15)
		.regex(/^[a-zA-Z0-9_-]+$/),
	}),
})
