import { data, redirect } from 'react-router';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import type { Route } from './+types/refresh';
import { commitSession, request_session } from '~/session.server';

function JWT_verify(token_access: string): JwtPayload | null {
	try {
		const ACCESS_SECRET = process.env['ACCESS_SECRET'];
		if (!ACCESS_SECRET)
			throw new Error('Missing required environemnt variable ACCESS_SECRET');

		const payload = jwt.verify(token_access, ACCESS_SECRET);
		if (typeof payload === 'string') return null;

		return payload;
	} catch (err) {
		if (err instanceof jwt.TokenExpiredError) return { exp: 0 };
		return null;
	}
}

async function update_access(token: string) {
	try {
		const url = new URL(
			'/api/auth/refresh',
			import.meta.env.VITE_REST_USER_ORIGIN
		);
		const res = await fetch(url, {
			method: 'POST',
			headers: new Headers({ Authorization: `Bearer ${token}` }),
		});

		const type =
			res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
		if (!res.ok || type !== 'application/json') return null;

		type JSONData_Refresh = {
			token_access: string;
		};
		const { token_access } = (await res.json()) as JSONData_Refresh;
		return token_access;
	} catch (err) {
		console.error(err);
		return null;
	}
}
export async function action({ request }: Route.ActionArgs) {
	const session = await request_session(request);
	const user = session.get('user');
	if (!user) {
		session.flash('error', 'No session to refresh');
		return data(
			{ ok: false },
			{ headers: { 'Set-Cookie': await commitSession(session) } }
		);
	}

	const { token_access: token_access_curr } = user;

	const payload = JWT_verify(token_access_curr);
	if (!payload) {
		session.unset('user');
		session.flash('error', 'Token could not be verified');
		return data(
			{ ok: false },
			{ headers: { 'Set-Cookie': await commitSession(session) } }
		);
	}

	const { exp: unixExpiryAccess } = payload;
	if (typeof unixExpiryAccess !== 'number') {
		session.unset('user');
		session.flash('error', 'Token must have an exp claim on it');
		return data(
			{ ok: false },
			{ headers: { 'Set-Cookie': await commitSession(session) } }
		);
	}

	const unixNow = Math.floor(Date.now() / 1_000);
	const unixThreshold = parseInt(process.env.ACCESS_EXPIRY_THRESHOLD ?? '20');
	if (unixExpiryAccess >= unixThreshold + unixNow) {
		// NOTE(xenobas): If there's time to spare no need for a refresh
		return data({ ok: true, token_access: token_access_curr });
	}

	const { token_refresh, expiry } = user;
	const dateExpiryRefresh = new Date(expiry);
	const unixExpiryRefresh = dateExpiryRefresh.getTime() / 1_000;
	if (unixExpiryRefresh <= unixNow) {
		// NOTE(xenobas): On refresh expiry must re sign-in manually.
		session.unset('user');
		session.flash('error', 'Session has expired');
		return redirect('/signin', {
			headers: { 'Set-Cookie': await commitSession(session) },
		});
	}

	const token_access_next = await update_access(token_refresh);
	if (!token_access_next) {
		session.unset('user');
		session.flash('error', 'Could not refresh access token');
		return redirect('/signin', {
			headers: { 'Set-Cookie': await commitSession(session) },
		});
	}

	session.set('user', { ...user, token_access: token_access_next });
	return data(
		{ ok: true, token_access: token_access_next },
		{ headers: { 'Set-Cookie': await commitSession(session) } }
	);
}
