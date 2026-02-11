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

export const registerSchema = z.object({
	// trim spaces
	body: z.object({
		username: z
			.string()
			.trim()
			.min(3)
			.max(15)
			.regex(/^[a-zA-Z0-9_-]+$/), // add '-', so yait-nas is valid
		email: z.string().trim().email({ pattern: z.regexes.email }),
		password: z.string().trim().min(12),
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
		password: z.string().trim().min(12),
	}),
});

const profileBody = z.object({
	username: z
		.string()
		.trim()
		.min(3)
		.max(15)
		.regex(/^[a-zA-Z0-9_-]+$/), // add '-', so yait-nas is valid
	email: z.string().trim().email({ pattern: z.regexes.email }),
	password: z.string().trim().min(12),
	bio: z.string().trim().max(500),
	location: z.string().trim().max(50),
	socialmedia: z.string().trim().url(),
	isprivate: z.coerce.boolean(),
});

export const updateProfileSchema = z.object({
	body: profileBody.partial(),
});
