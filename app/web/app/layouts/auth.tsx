import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { data, redirect, Outlet, useNavigate } from 'react-router';

import type { Route } from './+types/auth';
import { request_session_user } from '~/session.server';
import { UserContext, type UserContextValue } from '~/contexts/UserContext';

export async function loader({ request }: Route.LoaderArgs) {
	const user = await request_session_user(request);
	if (!user) {
		const uri_original = new URL(request.url);
		const uri_redirect = new URL(
			'/signin',
			uri_original.protocol + '//' + uri_original.host
		);
		uri_redirect.searchParams.set('redirect_uri', uri_original.toString());

		return redirect(uri_redirect.toString());
	}

	return data({ user });
}

async function api_auth_logout(token: string) {
	try {
		const url = new URL(
			'/api/auth/logout',
			import.meta.env.VITE_REST_USER_ORIGIN
		);
		url.searchParams.set('token', token);

		const res = await fetch(url, { method: 'DELETE' });
		if (!res.ok) throw new Error(res.statusText);
	} catch (error) {
		const message =
			(error instanceof Error ? error.message : error?.toString()) ??
			'An internal server error';
		console.error('Could not invalidate refresh token:', message);
	}
}

export default function Layout({ loaderData }: Route.ComponentProps) {
	const { user } = loaderData;

	// TODO(xenobas): Show logging out banner...
	const navigate = useNavigate();
	const mutLogout = useMutation<unknown, Error, string>({
		async mutationFn(token: string) {
			await api_auth_logout(token);
		},
	});
	const [userState, setUserState] =
		useState<UserContextValue['userState']>(user);
	const logoutUserState = async () => {
		console.log('logoutUserState');

		await mutLogout.mutateAsync(user.token_refresh);
		await navigate('/signout');
	};

	return (
		<UserContext value={{ userState, setUserState, logoutUserState }}>
			<Outlet />
		</UserContext>
	);
}
