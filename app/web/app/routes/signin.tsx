import { Link } from 'react-router';
import { useState, type FormEvent } from 'react';
import type { Route } from './+types/signin';
import FormInput from '../components/FormInput';
import FormDivider from '../components/FormDivider';
import OAuthButton from '../components/OAuthButton';
import Button from '../components/Button';
import { useFormValidation } from '../hooks/useFormValidation';
import { validationRules } from '../utils/validation';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Sign In' }];
}

export default function Page() {
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

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (validateForm()) {
			// TODO: Submit form
			alert(`Form submitted:\nusername: ${username},\npass: ${password}`);
		}
	};

	const handleOAuth = () => {
		// TODO: OAuth implementation
		alert('OAuth sign in');
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
