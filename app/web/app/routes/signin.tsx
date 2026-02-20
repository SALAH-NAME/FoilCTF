import { Link, useNavigate } from 'react-router';
import { useState, type SubmitEvent } from 'react';

import type { Route } from './+types/signin';

import Button from '../components/Button';
import FormInput from '../components/FormInput';
import FormDivider from '../components/FormDivider';
import OAuthButton from '../components/OAuthButton';

import { validationRules } from '../utils/validation';
import { useFormValidation } from '../hooks/useFormValidation';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Sign In' }];
}

export default function Page() {
	const navigate = useNavigate();

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
		e.preventDefault();
		if (!validateForm()) return;

		// const credentials = { username, password };
		// TODO(xenobas): Implement login via email/password
	};

	return (
		<div className="h-full bg-background flex items-center justify-center px-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-dark mb-2">Sign In</h1>
					<p className="text-dark/60">Welcome back to FoilCTF</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
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
				</form>

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
