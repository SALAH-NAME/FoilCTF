import { redirect, Outlet } from 'react-router';

import type { Route } from './+types/guest';
import { request_session_user } from '~/session.server';

export async function loader({ request }: Route.LoaderArgs) {
	const user = await request_session_user(request);
	if (user) return redirect('/');
}
export default function Layout({}: Route.ComponentProps) {
	return <Outlet />;
}
