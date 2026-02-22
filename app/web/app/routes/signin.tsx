import { data, redirect, Form, Link, useSearchParams } from 'react-router';
import { useEffect, useState, type SubmitEvent } from 'react';

import type { Route } from './+types/signin';

import { useToast } from '~/contexts/ToastContext';
import { validationRules } from '~/utils/validation';
import { useFormValidation } from '~/hooks/useFormValidation';
import { commitSession, request_session } from '~/session.server';

import Button from '~/components/Button';
import FormInput from '~/components/FormInput';
import FormDivider from '~/components/FormDivider';
import OAuthButton from '~/components/OAuthButton';

type Credentials = { username: string; password: string };
async function fetch_tokens(credentials: Credentials) {
	const url = new URL('/api/auth/login', import.meta.env.VITE_REST_USER_ORIGIN);
	const res = await fetch(url, {
		method: 'POST',
		headers: new Headers({
			'Content-Type': 'application/json',
		}),
		body: JSON.stringify(credentials),
	});

	const json = await res.json();
	if (!res.ok) {
		const { error } = json as { error: string };
		throw new Error(error);
	}

	type JSONData_Tokens = {
		token_access: string;
		token_refresh: string;
		expiry: string;
	};
	return json as JSONData_Tokens;
}
async function fetch_user(token: string) {
	const url = new URL('/api/users/me', import.meta.env.VITE_REST_USER_ORIGIN);
	const res = await fetch(url, {
		headers: new Headers({
			Authorization: `Bearer ${token}`,
		}),
	});

	const json = await res.json();
	if (!res.ok) {
		const { error } = json as { error: string };
		throw new Error(error);
	}

	type JSONData_User = {
		id: number;
		createdAt: string;
		bannedUntil: string | null;
		email: string | null;
		username: string;
		role: 'admin' | 'user';
		profileId: number | null;
		oauth42_login: string | null;
	};
	return json as JSONData_User;
}

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Sign In' }];
}
export async function action({ request }: Route.ActionArgs) {
	try {
		const session = await request_session(request);
		const form_data = await request.formData();

		let redirect_uri = form_data.get('redirect_uri');
		if (typeof redirect_uri !== 'string' || !redirect_uri) redirect_uri = '/';

		const username = form_data.get('username');
		const password = form_data.get('password');

		if (typeof username !== 'string' || !username)
			throw new Error('Invalid username');
		if (typeof password !== 'string' || !password)
			throw new Error('Invalid password');

		const { token_access, expiry, token_refresh } = await fetch_tokens({
			username,
			password,
		});

		const user = await fetch_user(token_access);
		session.set('user', {
			expiry,
			token_access,
			token_refresh,

			id: user.id,
			role: user.role,
			username: user.username,
		});

		return redirect(redirect_uri, {
			headers: { 'Set-Cookie': await commitSession(session) },
		});
	} catch (err) {
		return data({
			error:
				(err instanceof Error ? err.message : err?.toString()) ??
				'An internal server error has occurred',
			timestamp: Date.now(),
		});
	}
}

export default function Page({ actionData }: Route.ComponentProps) {
	const { addToast } = useToast();

	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const { errors, touched, handleBlur, handleChange } = useFormValidation({
		username: validationRules.username,
		password: validationRules.password,
	});

	const validateForm = () => {
		const usernameError = validationRules.username(username);
		const passwordError = validationRules.password(password);
		return !usernameError && !passwordError;
	};

	const handleOAuth = async () => {
		const location = window.location;
		const location_search = new URLSearchParams(location.search);

		const uri_redirect = new URL(
			'/oauth/42',
			location.protocol + '//' + location.host
		);
		const uri_redirect_prev = location_search.get('redirect_uri');
		if (uri_redirect_prev)
			uri_redirect.searchParams.set('redirect_uri', uri_redirect_prev);

		const origin =
			import.meta.env.VITE_REST_USER_ORIGIN ?? 'http://localhost:3001';
		const uri_oauth = new URL('/api/oauth/42/connect', origin);
		uri_oauth.searchParams.set('redirect_uri', uri_redirect.toString());

		window.location.href = uri_oauth.toString();
	};
	const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
		if (!validateForm()) e.preventDefault();
		// NOTE(xenobas): If the form is valid then it goes through the action
	};

	useEffect(() => {
		if (!actionData?.error) return;

		addToast({
			variant: 'error',
			title: 'Sign in Error',
			message: actionData.error,
		});
	}, [actionData?.error, actionData?.timestamp]);

	const [searchParams, _setSearchParams] = useSearchParams();
	const getRedirectURI = () => {
		return searchParams.get('redirect_uri') ?? '/';
	};

	return (
		<div className="h-full bg-background flex items-center justify-center px-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-dark mb-2">Sign In</h1>
					<p className="text-dark/60">Welcome back to FoilCTF</p>
				</div>

				<Form
					onSubmit={handleSubmit}
					action="/signin"
					method="POST"
					className="space-y-4"
				>
					<input type="hidden" name="redirect_uri" value={getRedirectURI()} />
					<FormInput
						id="username"
						name="username"
						type="text"
						label="Username"
						value={username}
						onChange={(e) => {
							const value = e.target.value;
							setUsername(value);
							handleChange('username', value);
						}}
						onBlur={() => handleBlur('username', username)}
						error={errors.username}
						touched={touched.username}
						required
					/>

					<FormInput
						id="password"
						name="password"
						type="password"
						label="Password"
						value={password}
						onChange={(e) => {
							const value = e.target.value;
							setPassword(value);
							handleChange('password', value);
						}}
						onBlur={() => handleBlur('password', password)}
						error={errors.password}
						touched={touched.password}
						required
					/>
					<Button type="submit" className="w-full">
						Sign In
					</Button>
					<FormDivider />
					<OAuthButton text="Sign in with" onClick={handleOAuth} />
				</Form>

				<p className="text-center text-dark/60 text-sm mt-6">
					Don't have an account?{' '}
					<Link
						to={'/register'}
						className="text-primary font-semibold hover:underline"
					>
						Register
					</Link>
				</p>
			</div>
		</div>
	);
}
