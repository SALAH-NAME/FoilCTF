import zod from 'zod';
import type { Request, Response } from 'express';
import {
	ENV_OAUTH_42_SECRET,
	ENV_OAUTH_42_UID,
	RefreshTokenExpiry,
} from '../utils/env';
import { User } from '../utils/types';
import { db } from '../utils/db';
import { users as table_users, sessions as table_sessions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { generateAccessToken, generateRefreshToken } from '../utils/utils';
import ms from 'ms';

export function route_oauth_42_connect(req: Request, res: Response) {
	const uri_redirect_client = zod.url().parse(req.query.redirect_uri);

	const uri_service_protocol = req.protocol;
	const uri_service_origin = zod.string().parse(req.get('Host'));

	const uri_redirect = new URL(
		'/api/oauth/42/connect/verify',
		`${uri_service_protocol}://${uri_service_origin}`
	);
	uri_redirect.searchParams.set('redirect_uri', uri_redirect_client);

	const uri_oauth = new URL('/oauth/authorize', 'https://api.intra.42.fr');
	uri_oauth.searchParams.set('response_type', 'code'); // NOTE(xenobas): 42 says to hard code this stuff
	uri_oauth.searchParams.set('redirect_uri', uri_redirect.toString());
	uri_oauth.searchParams.set('client_id', ENV_OAUTH_42_UID);

	return res.redirect(303, uri_oauth.toString());
}
export async function route_oauth_42_link(
	req: Request,
	res: Response<any, { user: User }>
) {
	const {
		user: { id: user_id },
	} = res.locals;

	const [user] = await db
		.select()
		.from(table_users)
		.where(eq(table_users.id, user_id));
	if (user!.oauth42_login)
		return res
			.status(400)
			.send('User already is linked to a 42Intra profile')
			.end();

	const uri_redirect_client = zod.url().parse(req.query.redirect_uri);

	const uri_service_protocol = req.protocol;
	const uri_service_origin = zod.string().parse(req.get('Host'));

	const uri_redirect = new URL(
		'/api/oauth/42/link/verify',
		`${uri_service_protocol}://${uri_service_origin}`
	);
	uri_redirect.searchParams.set('redirect_uri', uri_redirect_client);
	uri_redirect.searchParams.set('user_id', user_id.toString());

	const uri_oauth = new URL('/oauth/authorize', 'https://api.intra.42.fr');
	uri_oauth.searchParams.set('response_type', 'code'); // NOTE(xenobas): 42 says to hard code this stuff
	uri_oauth.searchParams.set('redirect_uri', uri_redirect.toString());
	uri_oauth.searchParams.set('client_id', ENV_OAUTH_42_UID);

	return res.redirect(303, uri_oauth.toString());
}

async function fetch_42_token(
	req: Request,
	route_origin: 'connect' | 'link',
	uri_redirect_client: string,
	code: string,
	user_id?: number
): Promise<string | null> {
	const uri_service_protocol = req.protocol;
	const uri_service_origin = zod.string().parse(req.get('Host'));

	const uri_redirect = new URL(
		`/api/oauth/42/${route_origin}/verify`,
		`${uri_service_protocol}://${uri_service_origin}`
	);
	uri_redirect.searchParams.set('redirect_uri', uri_redirect_client);
	if (user_id) uri_redirect.searchParams.set('user_id', user_id.toString());

	const uri_token = new URL('/oauth/token', 'https://api.intra.42.fr');
	uri_token.searchParams.set('grant_type', 'authorization_code'); // NOTE(xenobas): Even more 42 hard coding
	uri_token.searchParams.set('client_id', ENV_OAUTH_42_UID);
	uri_token.searchParams.set('client_secret', ENV_OAUTH_42_SECRET);
	uri_token.searchParams.set('code', code);
	uri_token.searchParams.set('redirect_uri', uri_redirect.toString());

	const res_token = await fetch(uri_token, { method: 'POST' });

	if (!res_token.ok) {
		const text_token = await res_token.text();

		console.log(
			'ERROR - OAuth42 - /oauth/token status code %d, %s',
			res_token.status,
			res_token.statusText
		);
		console.log(
			res_token.headers.get('content-type') === 'application/json'
				? JSON.parse(text_token)
				: text_token
		);
		return null;
	}

	const schema_token = zod.object({
		access_token: zod.string(),
	});

	const { access_token } = schema_token.parse(await res_token.json());
	return access_token;
}

const schema_42_profile = zod.object({
	id: zod.number(),
	url: zod.string(),
	email: zod.string(),
	login: zod.string(),
	wallet: zod.number(),

	pool_month: zod.optional(zod.string()),
	pool_year: zod.optional(zod.string()),

	image: zod.object({
		link: zod.string(),
		versions: zod.object({
			large: zod.string(),
			medium: zod.string(),
			small: zod.string(),
			micro: zod.string(),
		}),
	}),

	first_name: zod.string(),
	last_name: zod.string(),
	displayname: zod.string(),

	['kind']: zod.string(),
	['staff?']: zod.boolean(),
	['alumni?']: zod.boolean(),
	['active?']: zod.boolean(),
});
export async function fetch_42_profile(
	token: string
): Promise<zod.infer<typeof schema_42_profile> | null> {
	const uri = new URL('/v2/me', 'https://api.intra.42.fr');
	const res = await fetch(uri, {
		headers: { Authorization: 'Bearer ' + token },
	});
	if (!res.ok) return null;

	const data = await res.json();
	return schema_42_profile.parse(data);
}

function base64_encode(value: unknown): string {
	if (typeof value === 'object')
		return Buffer.from(JSON.stringify(value), 'ascii').toString('base64');
	return Buffer.from(value?.toString() ?? '', 'ascii').toString('base64');
}
async function query_oauth_user(login: string) {
	try {
		const [user]: (Omit<User, 'password'> & { password?: string })[] = await db
			.select()
			.from(table_users)
			.where(eq(table_users.oauth42_login, login))
			.limit(1);
		delete user?.['password'];

		return user;
	} catch (err) {
		console.error(err);
		return null;
	}
}

export function route_oauth_42_verify(route_origin: 'connect' | 'link') {
	const schema_int = zod.preprocess((val) => {
		if (typeof val === 'string') return Number.parseInt(val);
		return val;
	}, zod.int());
	const schema_query_success = zod.object({
		code: zod.string(),
	});
	const schema_query_failure = zod.object({
		error: zod.string(),
		error_description: zod.string(),
	});
	const schema_query_shared = zod.object({
		redirect_uri: zod.url(),
		user_id: zod.optional(schema_int),
	});
	const schema_query = zod.intersection(
		schema_query_shared,
		zod.union([schema_query_success, schema_query_failure])
	);

	return async (req: Request, res: Response) => {
		const { redirect_uri, user_id, ...query } = schema_query.parse(req.query);

		if (route_origin === 'link' && user_id === undefined) {
			const uri = new URL(redirect_uri);
			uri.searchParams.set('error', 'query-missing');
			uri.searchParams.set(
				'error_description',
				'Required parameter "user_id" is missing'
			);

			return res.redirect(303, uri.toString());
		}
		if (Object.hasOwn(query, 'error')) {
			const { error, error_description } = query as zod.infer<
				typeof schema_query_failure
			>;

			const uri = new URL(redirect_uri);
			uri.searchParams.set('error', error);
			uri.searchParams.set('error_description', error_description);

			return res.redirect(303, uri.toString());
		}

		const { code } = query as zod.infer<typeof schema_query_success>;
		const token = await fetch_42_token(
			req,
			route_origin,
			redirect_uri,
			code,
			user_id
		);
		if (!token) {
			const uri = new URL(redirect_uri);
			uri.searchParams.set('error', 'oauth-token');
			uri.searchParams.set(
				'error_description',
				'Could not fetch 42OAuth token'
			);

			return res.redirect(303, uri.toString());
		}

		const profile = await fetch_42_profile(token);
		if (!profile) {
			const uri = new URL(redirect_uri);
			uri.searchParams.set('error', 'oauth-profile');
			uri.searchParams.set(
				'error_description',
				'Could not fetch 42Intra profile'
			);

			return res.redirect(303, uri.toString());
		}

		const uri = new URL(redirect_uri);
		switch (route_origin) {
			case 'connect':
				{
					const user = await query_oauth_user(profile.login);
					if (user) {
						try {
							const token_access = generateAccessToken(
								user.username,
								user.role,
								user.id
							);
							const token_refresh = generateRefreshToken(
								user.username,
								user.id
							);
							const expiry = new Date(
								Date.now() + ms(RefreshTokenExpiry)
							).toISOString();
							uri.searchParams.set(
								'data',
								base64_encode({
									did_authenticate: true,
									token_access,
									token_refresh,
									expiry,
									user,
								})
							);

							await db.insert(table_sessions).values({
								refreshtoken: token_refresh,
								expiry,
								user_id: user.id,
							});
						} catch (error) {
							const uri = new URL(redirect_uri);
							uri.searchParams.set('error', 'database-operation');
							uri.searchParams.set(
								'error_description',
								'Could not generate authentication tokens for already existing user'
							);

							return res.redirect(303, uri.toString());
						}
					} else {
						uri.searchParams.set(
							'data',
							base64_encode({ did_authenticate: false, profile, oauth_token: token })
						);
					}
				}
				break;
			case 'link':
				{
					try {
						await db
							.update(table_users)
							.set({ oauth42_login: profile.login })
							.where(eq(table_users.id, user_id!));
					} catch (err) {
						const uri = new URL(redirect_uri);
						uri.searchParams.set('error', 'database-operation');
						uri.searchParams.set(
							'error_description',
							'Could not link OAuth profile with user'
						);

						return res.redirect(303, uri.toString());
					}
				}
				break;
		}
		return res.redirect(303, uri.toString());
	};
}
