import { useQuery } from '@tanstack/react-query';
import { createContext } from 'react';
import { data, Outlet, useLoaderData } from 'react-router';

import { getSession } from '~/session.server';
import type { Layout } from './types';

type LoaderData = {
	tokenAccess?: string;
	expiryAccess?: number;

	tokenRefresh?: string;
};

export async function loader({ request }: Layout.LoaderArgs) {
	const cookie = request.headers.get('Cookie');
	if (!cookie) return data({});

	const session = await getSession(cookie);
	const tokenAccess = session.get('token_access');
	const expiryAccess = session.get('expiry_access');
	const tokenRefresh = session.get('token_refresh');
	return data({ tokenAccess, expiryAccess, tokenRefresh });
}

interface UserMe {
	id: number;

	created_at: string;
	banned_until: string | null;

	email: string | null;
	username: string;
	role: 'user' | 'admin';

	profile_id: number | null;
}

async function fetch_user_me({
	tokenAccess,
}: {
	tokenAccess: string;
	tokenRefresh: string;
}): Promise<UserMe | null> {
	const origin =
		import.meta.env.VITE_REST_USER_ORIGIN ?? 'http://localhost:3001';

	const url = new URL('/api/users/me', origin);
	const headers = new Headers({ Authorization: 'Bearer ' + tokenAccess });

	const res = await fetch(url, { headers });
	const type = (res.headers.get('Content-Type') ?? '').split(';')[0];
	if (!res.ok || type !== 'application/json')
		// TODO(xenobas): Throw an error toast
		return null;

	return await res.json();
}

export const UserMeContext = createContext<UserMe | null>(null);
export default function Layout() {
	const {
		tokenAccess,
		tokenRefresh,
		// TODO(xenobas): Use expiryAccess for managing refreshes.
	} = useLoaderData() as LoaderData;

	const queryKey = ['auth-user', tokenAccess, tokenRefresh] as [
		string,
		string | undefined,
		string | undefined,
	];
	const { data } = useQuery({
		queryKey,
		initialData: null,
		async queryFn({ queryKey }): Promise<UserMe | null> {
			const [_queryCacheKey, tokenAccess, tokenRefresh] = queryKey;
			if (!tokenAccess || !tokenRefresh) return null;

			return await fetch_user_me({ tokenAccess, tokenRefresh });
		},
	});

	return (
		<UserMeContext value={data}>
			<Outlet />
		</UserMeContext>
	);
}
