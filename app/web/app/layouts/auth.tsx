import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { data, redirect, Outlet, useNavigate, useFetcher } from 'react-router';

import type { Route } from './+types/auth';

import { useToast } from '~/contexts/ToastContext';
import { UserContext, type UserContextValue } from '~/contexts/UserContext';
import { request_session_user } from '~/session.server';

async function fetch_signout(token: string) {
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

export default function Layout({ loaderData }: Route.ComponentProps) {
	const fetcher = useFetcher();
	const { addToast } = useToast();
	useEffect(() => {
		if (fetcher.state !== 'idle' || !fetcher.data)
			return ;

		const { data }: { data: { ok: false } | { ok: true, token_access: string } } = fetcher;
		if (data.ok) {
			addToast({
				variant: 'info',
				title: 'Session',
				message: 'Your session has been refreshed',
			});
		}

		fetcher.reset();
	}, [fetcher.state, fetcher.data]);

	const { user } = loaderData;
	const [userState, setUserState] =
		useState<UserContextValue['userState']>(user);

	// TODO(xenobas): Show some sort of overlay during logout
	const navigate = useNavigate();
	const mutLogout = useMutation<unknown, Error, string, unknown>({
		async mutationFn(token: string) {
			await fetch_signout(token);
		},
		async onSuccess() {
			await navigate('/signout');
		},
		async onError(err) {
			addToast({
				variant: 'error',
				title: 'Sign out Error',
				message: err.message,
			});
		},
	});
	const logoutUserState = () => mutLogout.mutate(user.token_refresh);
	const refreshUserState = async () => {
		await fetcher.submit(null, {
			method: 'post',
			action: '/refresh',
		});
	};

	return (
		<UserContext
			value={{ userState, setUserState, logoutUserState, refreshUserState }}
		>
			<Outlet />
		</UserContext>
	);
}
