import { NextFunction, Request, Response } from 'express';
import { users } from './db/schema';
import { db } from './utils/db';
import { eq, ilike } from 'drizzle-orm';

export class FoilCTF_Error extends Error {
	public statusCode: number;
	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;

		this.name = 'FoilCTF_Error';
	}

	toJSON() {
		return {
			error: true,
			message: this.message,
			status: this.statusCode
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
			message: this.message,
			status: this.statusCode
		}
	}
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const search = req.query.q as string;

    const decodedUser = res.locals.user;
    if (decodedUser.role !== "admin")
        return res.status(403).json(new FoilCTF_Error("Forbidden", 403));

    const dbUsers = await db
        .select()
        .from(users)
        .where(search ? ilike(users.username, `${search}`) : undefined)
        .limit(limit)
        .offset(limit * (page - 1));

    return res.status(200).json({
        data: dbUsers,
        limit,
        page,
    });
}

export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
    const target = req.params.username as string;
    const newRole = req.body.newRole;

	const decodedUser = res.locals.user;
    if (decodedUser.role !== "admin")
        return res.status(403).json(new FoilCTF_Error("Forbidden", 403));

    await db.update(users).set({ role: newRole }).where(eq(users.username, target));
    return res.status(200).json(new FoilCTF_Success("OK", 200));
}

export async function deleteUser(req: Request, res: Response) {
    const target = req.params.username as string;

	const decodedUser = res.locals.user;
    if (decodedUser.role !== "admin")
        return res.status(403).json(new FoilCTF_Error("Forbidden", 403));

    await db.delete(users).where(eq(users.username, target));
    return res.status(204).json(new FoilCTF_Success("No Content", 204));
}
