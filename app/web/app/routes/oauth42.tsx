import { redirect } from 'react-router';

import type { Route } from './+types/oauth42';

import { commitSession, request_session } from '~/session.server';

type TokenData = {
	did_authenticate: true;
	token_access: string;
	token_refresh: string;
	expiry: string;
	user: { id: number; username: string; role: 'admin' | 'user' };
};
type ProfileData = {
	'id': number;
	'url': string;
	'email': string;
	'login': string;
	'wallet': number;
	'image': {
		link: string;
		versions: {
			large: string;
			medium: string;
			small: string;
			micro: string;
		};
	};
	'first_name': string;
	'last_name': string;
	'displayname': string;
	'kind': string;
	'staff?': boolean;
	'alumni?': boolean;
	'active?': boolean;
	'pool_month'?: string | undefined;
	'pool_year'?: string | undefined;
};
type Data = TokenData | { did_authenticate: false; profile: ProfileData };

export async function loader({ request }: Route.LoaderArgs) {
	let redirect_fallback = '/';
	const url = new URL(request.url);
	const session = await request_session(request);

	const query_data = url.searchParams.get('data');
	if (query_data) {
		const auth_data = JSON.parse(
			Buffer.from(query_data, 'base64').toString('ascii')
		) as Data;
		switch (auth_data.did_authenticate) {
			case true:
				{
					const { user, token_access, token_refresh, expiry } = auth_data;
					session.set('user', {
						id: user.id,
						role: user.role,
						username: user.username,

						token_access,
						token_refresh,
						expiry,
					});
					// session.set('token_access', token_access);
				}
				break;
			case false: {
				// NOTE(xenobas): Thoughts
				// + '/register' requires email, username, password while the OAuth Profile contains different stuff
				//	- This means we will need a dedicated register for 42 users where they are only prompted with the username
				//	- That could be right here.
				//
				//  - We could also create said account on the backend, but that throws us back into the username issue
				// const { profile } = auth_data;
				return redirect('/register');
			}
			default:
				{
					// NOTE(xenobas): This means we got an unexpected response, which in turn is just an error and go to somewhere else.
				}
				break;
		}
	} else {
		const error = url.searchParams.get('error');
		const error_desc = url.searchParams.get('error_description');

		session.flash(
			'error',
			(error_desc || error) ?? 'An internal server has occurred'
		);
		redirect_fallback = '/signin';
	}

	const query_redirect_uri =
		url.searchParams.get('redirect_uri') || redirect_fallback;
	return redirect(query_redirect_uri, {
		headers: { 'Set-Cookie': await commitSession(session) },
	});
	// return data({ query: { query_redirect_uri } }, { headers: { 'Set-Cookie': await commitSession(session) } });
}

export default function Page({ loaderData }: Route.ComponentProps) {
	const { query } = loaderData;
	return <>{JSON.stringify(query)}</>;
}
