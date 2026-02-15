import { createCookieSessionStorage } from 'react-router';

export interface SessionData {
	token_access: string;
	token_refresh: string;
	expiry_access: number;
}
export interface SessionFlash {}

export const { getSession, commitSession, destroySession } =
	createCookieSessionStorage<SessionData, SessionFlash>();
