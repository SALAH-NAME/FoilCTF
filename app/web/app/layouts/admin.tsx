import { data, redirect, Outlet } from 'react-router';

import type { Route } from './+types/admin';
import {
	commitSession,
	request_session,
	request_session_user,
} from '~/session.server';

export async function loader({ request }: Route.LoaderArgs) {
	const admin = await request_session_user(request);
	if (!admin) {
		const uri_original = new URL(request.url);
		const uri_redirect = new URL(
			'/signin',
			uri_original.protocol + '//' + uri_original.host
		);
		uri_redirect.searchParams.set('redirect_uri', uri_original.toString());

		return redirect(uri_redirect.toString());
	}
	if (admin.role !== 'admin') {
		const session = await request_session(request);
		session.flash('error', 'Missing required privileges');

		return redirect('/', {
			headers: { 'Set-Cookie': await commitSession(session) },
		});
	}

	return data({ admin });
}
export default function Layout({ loaderData }: Route.ComponentProps) {
	const { admin } = loaderData;
	// TODO(xenobas): Admin Provider/Context
	return <Outlet />;
}
