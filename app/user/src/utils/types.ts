import { Request } from 'express';
import { users, sessions, profiles } from '../db/schema';
import { z } from 'zod';

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

const PASSWORD_MIN_CHARACTERS = 8;

export const registerSchema = z.object({
	// trim spaces
	body: z.object({
		username: z
			.string()
			.trim()
			.min(3)
			.max(15)
			.regex(/^[a-zA-Z0-9_-]+$/), // add '-', so yait-nas is valid
		email: z.email(),
		password: z.string().trim().min(PASSWORD_MIN_CHARACTERS),
	}),
});

export const loginSchema = z.object({
	// same here
	body: z.object({
		username: z
			.string()
			.trim()
			.min(3)
			.max(15)
			.regex(/^[a-zA-Z0-9_-]+$/), // same here
		password: z.string().trim(),
	}),
});

const userBody = z.object({
	username: z
		.string()
		.trim()
		.min(3)
		.max(15)
		.regex(/^[a-zA-Z0-9_-]+$/), // add '-', so yait-nas is valid
	email: z.email(),
	newPassword: z.string().trim().min(PASSWORD_MIN_CHARACTERS),
	oldPassword: z.string().trim(),
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
