import { Link, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { useState, type SubmitEvent } from 'react';

import type { Route } from './+types/register';

import { validationRules } from '~/utils/validation';
import { useFormValidation } from '~/hooks/useFormValidation';

import Button from '~/components/Button';
import FormInput from '~/components/FormInput';
import FormDivider from '~/components/FormDivider';
import OAuthButton from '~/components/OAuthButton';
import { useToast } from '~/contexts/ToastContext';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Register' }];
}

type RegisterPayload = { username: string; password: string; email: string };
async function register_user(payload: RegisterPayload) {
	const url = new URL(
		'/api/auth/register',
		import.meta.env.VITE_REST_USER_ORIGIN
	);
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});
	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Invalid response format');

	const data = await res.json();
	if (!res.ok || data.error)
		throw new Error(data.error ?? 'Internal server error');
}
export default function Page() {
	const navigate = useNavigate();
	const { addToast } = useToast();

	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const formData = { username, email, password, confirmPassword };

	const { errors, touched, handleBlur, handleChange } = useFormValidation({
		username: validationRules.username,
		email: validationRules.email,
		password: validationRules.password,
		confirmPassword: validationRules.confirmPassword,
	});

	const validateForm = () => {
		const emailError = validationRules.email(email);
		const usernameError = validationRules.username(username);
		const passwordError = validationRules.password(password);
		const confirmPasswordError = validationRules.confirmPassword(
			confirmPassword,
			{ password }
		);

		return (
			!usernameError && !emailError && !passwordError && !confirmPasswordError
		);
	};

	const mutRegister = useMutation<unknown, Error, RegisterPayload, unknown>({
		mutationFn: register_user,
		async onSuccess() {
			addToast({
				variant: 'success',

				title: 'Register success',
				message: 'Account has been created',
			});
			await navigate('/signin');
		},
		async onError(err) {
			addToast({
				variant: 'error',
				title: 'Register failed',
				message: err.message,
			});
		},
	});
	const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!validateForm()) return;

		mutRegister.mutate({ username, email, password });
	};

	const handleOAuth = () => {
		// TODO: OAuth implementation
		alert('OAuth register');
	};

	return (
		<div className="h-full bg-background flex items-center justify-center px-4 py-8">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-dark mb-2">Register</h1>
					<p className="text-dark/60">Join FoilCTF and start competing</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<FormInput
						id="username"
						name="username"
						type="text"
						label="Username"
						value={username}
						disabled={mutRegister.isPending}
						onChange={(e) => {
							const value = e.target.value;
							setUsername(value);
							handleChange('username', value, formData);
						}}
						onBlur={() => handleBlur('username', username, formData)}
						error={errors.username}
						touched={touched.username}
						autoComplete="username"
						required
					/>

					<FormInput
						id="email"
						name="email"
						type="email"
						label="Email"
						value={email}
						disabled={mutRegister.isPending}
						onChange={(e) => {
							const value = e.target.value;
							setEmail(value);
							handleChange('email', value, formData);
						}}
						onBlur={() => handleBlur('email', email, formData)}
						error={errors.email}
						touched={touched.email}
						autoComplete="email"
						required
					/>

					<FormInput
						id="password"
						name="password"
						type="password"
						label="Password"
						value={password}
						disabled={mutRegister.isPending}
						onChange={(e) => {
							const value = e.target.value;
							setPassword(value);
							handleChange('password', value, formData);
							if (touched.confirmPassword) {
								handleChange('confirmPassword', confirmPassword, {
									...formData,
									password: value,
								});
							}
						}}
						onBlur={() => handleBlur('password', password, formData)}
						error={errors.password}
						touched={touched.password}
						autoComplete="new-password"
						required
					/>

					<FormInput
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						label="Confirm Password"
						value={confirmPassword}
						disabled={mutRegister.isPending}
						onChange={(e) => {
							const value = e.target.value;
							setConfirmPassword(value);
							handleChange('confirmPassword', value, formData);
						}}
						onBlur={() =>
							handleBlur('confirmPassword', confirmPassword, formData)
						}
						error={errors.confirmPassword}
						touched={touched.confirmPassword}
						autoComplete="new-password"
						required
					/>
					<Button
						type="submit"
						className="w-full"
						disabled={mutRegister.isPending}
					>
						Register
					</Button>
					<FormDivider />
					<OAuthButton
						text="Register with"
						onClick={handleOAuth}
						disabled={mutRegister.isPending}
					/>
				</form>

				<p className="text-center text-dark/60 text-sm mt-6">
					Already have an account?{' '}
					<Link
						to={'/signin'}
						className="text-primary font-semibold hover:underline"
					>
						Sign In
					</Link>
				</p>
			</div>
		</div>
	);
}
