import { NextFunction, Request, Response } from 'express';
import { users } from './db/schema';
import { db } from './utils/db';
import { eq, and, or, ilike } from 'drizzle-orm';

export async function listUsers(req: Request, res: Response) {
    // const decodedUser = res.locals.user;
    const limit = Math.max(Number(req.query.limit) || 10, 1);
    const page = Math.max(Number(req.query.page) || 1, 1);
    // const search = req.query.q as string; // apply !!!

    const dbUsers = await db
        .select()
        .from(users) // all infos
        .limit(limit)
        .offset(limit * (page - 1));

    return res.json({
        data: dbUsers,
        limit,
        page,
    });
}

export async function updateUserRole(req: Request, res: Response) {
    const target = req.params.username as string;
    const newRole = req.body.newRole; // TODO: add as zod schema

    await db.update(users).set({ role: newRole }).where(eq(users.username, target));
    return res.status(201).send();
}

export async function deleteUser(req: Request, res: Response) {
    const target = req.params.username as string;

    await db.delete(users).where(eq(users.username, target));
    return res.status(204).send();
}
