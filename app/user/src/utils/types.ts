import { z } from 'zod';
import { Request } from 'express';

import { users, sessions, profiles } from '../db/schema';
import {
	PASSWORD_MIN_CHARACTERS,
	PASSWORD_MAX_CHARACTERS,
} from './env'

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

export class FoilCTF_Error extends Error {
	public statusCode: number;
	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;

		this.name = 'FoilCTF_Error';
	}

	toJSON() {
		return {
			ok: false,
			error: this.message,
		}
	}
}

export class FoilCTF_Success {
	public statusCode: number;
	public message: string;

	constructor(message: string, statusCode: number) {
		this.statusCode = statusCode;
		this.message = message
	}

	toJSON() {
		return {
			ok: true,
			message: this.message,
		}
	}
}


export const registerSchema = z.object({
	body: z.object({
		username: z
			.string()
			.min(3)
			.max(15)
			.regex(/^[a-zA-Z0-9_-]+$/), // add '-', so yait-nas is valid
		email: z.email(),
		password: z
			.string()
			.min(PASSWORD_MIN_CHARACTERS)
			.max(PASSWORD_MAX_CHARACTERS),
		oauth42: z.optional(z.object({
			login: z.string().min(1),
			token: z.string().min(1),
		})),
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
		.regex(/^[a-zA-Z0-9_-]+$/),
	email: z.email(),
	password_new: z
		.string()
		.min(PASSWORD_MIN_CHARACTERS)
		.max(PASSWORD_MAX_CHARACTERS),
	password: z.string(),
});

export const updateUserSchema = z.object({
	body: userBody.partial(),
});

const profileBody = z.object({
	bio: z.string().trim().max(500),
	location: z.string().trim().max(50),
	socialmedialinks: z.url(),
	isprivate: z.coerce.boolean(),
});

export const updateProfileSchema = z.object({
	body: profileBody.partial(),
});

export const teamCreationSchema = z.object({
	body: z.object({
		newTeamName: z
			.string()
			.min(3)
			.max(15)
			.regex(/^[a-zA-Z0-9_-]+$/),
		maxMembers: z
			.coerce
			.number()
			.min(1)
			.optional()
	}),
});

export const updateTeamSchema = z.object({
	body: z.object({
		isLocked: z.coerce.boolean().optional(),
		description: z.string().max(500).optional(),
		maxMembers: z.coerce.number().min(1).optional(),
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
