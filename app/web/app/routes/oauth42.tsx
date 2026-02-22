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
type Data =
	| TokenData
	| { did_authenticate: false; profile: ProfileData; oauth_token: string };

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
			case false: {
				const { profile, oauth_token } = auth_data;
				session.flash('oauth', {
					login: profile.login,
					token: oauth_token,
				});

				return redirect('/register', {
					headers: { 'Set-Cookie': await commitSession(session) },
				});
			}
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
				}
				break;
			default:
				{
					session.flash(
						'error',
						'Unknown response from authentication service'
					);
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
}
