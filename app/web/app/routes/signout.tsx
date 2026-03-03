import { redirect } from 'react-router';

import type { Route } from './+types/signout';
import { commitSession, request_session } from '~/session.server';

export async function loader({ request }: Route.LoaderArgs) {
	const session = await request_session(request);
	session.set('user', undefined);

	return redirect('/', {
		headers: { 'Set-Cookie': await commitSession(session) },
	});
}

export default function Page({}: Route.ComponentProps) {
	return <></>;
}
