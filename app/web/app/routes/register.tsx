import { Link } from 'react-router';
import { useState, type FormEvent } from 'react';
import type { Route } from './+types/register';
import Icon from '../components/Icon';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Register' }];
}

export default function Page() {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [errors, setErrors] = useState<{
		username?: string;
		email?: string;
		password?: string;
		confirmPassword?: string;
	}>({});
	const [touched, setTouched] = useState<{
		username?: boolean;
		email?: boolean;
		password?: boolean;
		confirmPassword?: boolean;
	}>({});

	const validateField = (
		name: 'username' | 'email' | 'password' | 'confirmPassword',
		value: string
	) => {
		let error = '';

		if (name === 'username') {
			if (value.length < 3 || value.length > 15) {
				error = 'Username must be between 3 and 15 characters';
			} else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
				error = 'Username can only contain letters, numbers, and underscores';
			}
		} else if (name === 'email') {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(value)) {
				error = 'Please enter a valid email address';
			}
		} else if (name === 'password') {
			if (value.length < 12) {
				error = 'Password must be at least 12 characters';
			}
		} else if (name === 'confirmPassword') {
			if (value !== password) {
				error = 'Passwords do not match';
			}
		}

		return error;
	};

	const handleBlur = (
		field: 'username' | 'email' | 'password' | 'confirmPassword'
	) => {
		setTouched({ ...touched, [field]: true });
		let value = '';
		if (field === 'username') value = username;
		else if (field === 'email') value = email;
		else if (field === 'password') value = password;
		else value = confirmPassword;

		const error = validateField(field, value);
		setErrors({ ...errors, [field]: error });
	};

	const handleChange = (
		field: 'username' | 'email' | 'password' | 'confirmPassword',
		value: string
	) => {
		if (field === 'username') setUsername(value);
		else if (field === 'email') setEmail(value);
		else if (field === 'password') {
			setPassword(value);
			if (touched.confirmPassword) {
				const confirmError =
					confirmPassword !== value ? 'Passwords do not match' : '';
				setErrors({ ...errors, password: '', confirmPassword: confirmError });
			}
		} else setConfirmPassword(value);

		if (touched[field]) {
			const error = validateField(field, value);
			setErrors({ ...errors, [field]: error });
		}
	};

	const validateForm = () => {
		const usernameError = validateField('username', username);
		const emailError = validateField('email', email);
		const passwordError = validateField('password', password);
		const confirmPasswordError = validateField(
			'confirmPassword',
			confirmPassword
		);

		setErrors({
			username: usernameError,
			email: emailError,
			password: passwordError,
			confirmPassword: confirmPasswordError,
		});
		setTouched({
			username: true,
			email: true,
			password: true,
			confirmPassword: true,
		});

		return (
			!usernameError && !emailError && !passwordError && !confirmPasswordError
		);
	};

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (validateForm()) {
			// TODO: Submit form
			alert(
				`Form submitted:\nusername: ${username},\npass: ${password},\nemails: ${email}`
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
					<div>
						<label
							htmlFor="username"
							className="block text-sm font-medium text-dark mb-1.5"
						>
							Username
						</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={(e) => handleChange('username', e.target.value)}
							onBlur={() => handleBlur('username')}
							className="w-full px-4 py-2.5 border border-dark/20 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-dark"
							required
						/>
						{touched.username && errors.username && (
							<p className="text-red-500 text-sm mt-1">{errors.username}</p>
						)}
					</div>

					<div>
						<label
							htmlFor="email"
							className="block text-sm font-medium text-dark mb-1.5"
						>
							Email
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => handleChange('email', e.target.value)}
							onBlur={() => handleBlur('email')}
							className="w-full px-4 py-2.5 border border-dark/20 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-dark"
							required
						/>
						{touched.email && errors.email && (
							<p className="text-red-500 text-sm mt-1">{errors.email}</p>
						)}
					</div>

					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-dark mb-1.5"
						>
							Password
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => handleChange('password', e.target.value)}
							onBlur={() => handleBlur('password')}
							className="w-full px-4 py-2.5 border border-dark/20 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-dark"
							required
						/>
						{touched.password && errors.password && (
							<p className="text-red-500 text-sm mt-1">{errors.password}</p>
						)}
					</div>

					<div>
						<label
							htmlFor="confirmPassword"
							className="block text-sm font-medium text-dark mb-1.5"
						>
							Confirm Password
						</label>
						<input
							id="confirmPassword"
							type="password"
							value={confirmPassword}
							onChange={(e) => handleChange('confirmPassword', e.target.value)}
							onBlur={() => handleBlur('confirmPassword')}
							className="w-full px-4 py-2.5 border border-dark/20 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-dark"
							required
						/>
						{touched.confirmPassword && errors.confirmPassword && (
							<p className="text-red-500 text-sm mt-1">
								{errors.confirmPassword}
							</p>
						)}
					</div>

					<button
						type="submit"
						className="w-full bg-primary text-white font-semibold py-2.5 rounded-md hover:bg-primary/80 transition-colors"
					>
						Register
					</button>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-dark/10"></div>
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="px-2 bg-background text-dark/60">OR</span>
						</div>
					</div>

					<button
						type="button"
						onClick={handleOAuth}
						className="group w-full border-2 border-dark/20 text-background bg-black font-semibold py-2.5 rounded-md hover:bg-dark/5 hover:text-black transition-colors flex items-center justify-center gap-2"
					>
						Register with
						<Icon
							name="42"
							className="size-5 fill-background group-hover:fill-black"
						/>
					</button>
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
