import { createCookieSessionStorage } from 'react-router';

export type SessionUser = {
	id: number;
	username: string;
	role: 'admin' | 'user';

	token_access: string;
	token_refresh: string;
	expiry: string;
};

type SessionData = {
	user?: SessionUser;
};
export type SessionFlash = {
	error?: string;
	oauth?: {
		login: string,
		token: string,
	},
};

export const { commitSession, destroySession, getSession } =
	createCookieSessionStorage<SessionData, SessionFlash>({
		cookie: {
			name: '__foilctf_session',
			path: '/',
			sameSite: 'lax',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			// TODO(xenobas): secrets: [process.env.SESSION_SECRET],
		},
	});

export async function request_session_user(
	req: Request
): Promise<SessionData['user']> {
	const cookie = req.headers.get('Cookie');
	const session = await getSession(cookie);

	return session.get('user');
}
export async function request_session(
	req: Request
): ReturnType<typeof getSession> {
	const cookie = req.headers.get('Cookie');
	return await getSession(cookie);
}
