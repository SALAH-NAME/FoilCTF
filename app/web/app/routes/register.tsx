import { Link } from 'react-router';
import { useState, type FormEvent } from 'react';
import type { Route } from './+types/register';
import FormInput from '../components/FormInput';
import FormDivider from '../components/FormDivider';
import OAuthButton from '../components/OAuthButton';
import Button from '../components/Button';
import { useFormValidation } from '../hooks/useFormValidation';
import { validationRules } from '../utils/validation';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Register' }];
}

export default function Page() {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const { errors, touched, handleBlur, handleChange } = useFormValidation({
		username: validationRules.username,
		email: validationRules.email,
		password: validationRules.password,
		confirmPassword: validationRules.confirmPassword,
	});

	const formData = { username, email, password, confirmPassword };

	const validateForm = () => {
		const usernameError = validationRules.username(username);
		const emailError = validationRules.email(email);
		const passwordError = validationRules.password(password);
		const confirmPasswordError = validationRules.confirmPassword(
			confirmPassword,
			{ password }
		);

		return (
			!usernameError && !emailError && !passwordError && !confirmPasswordError
		);
	};

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (validateForm()) {
			// TODO: Submit form
			alert(
				`Form submitted:\nusername: ${username},\nemail: ${email},\npass: ${password}`
			);
		}
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
					<Button type="submit" className="w-full">
						Register
					</Button>
					<FormDivider />
					<OAuthButton text="Register with" onClick={handleOAuth} />
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
