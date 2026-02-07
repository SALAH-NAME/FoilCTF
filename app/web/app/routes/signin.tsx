import { Link } from 'react-router';
import { useState, type FormEvent, type FocusEvent } from 'react';
import type { Route } from './+types/signin';
import Icon from '../components/Icon';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Sign In' }];
}

export default function Page() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [errors, setErrors] = useState<{
		username?: string;
		password?: string;
	}>({});
	const [touched, setTouched] = useState<{
		username?: boolean;
		password?: boolean;
	}>({});

	const validateField = (name: 'username' | 'password', value: string) => {
		let error = '';

		if (name === 'username') {
			if (value.length < 3 || value.length > 15) {
				error = 'Username must be between 3 and 15 characters';
			} else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
				error = 'Username can only contain letters, numbers, and underscores';
			}
		} else if (name === 'password') {
			if (value.length < 12) {
				error = 'Password must be at least 12 characters';
			}
		}

		return error;
	};

	const handleBlur = (field: 'username' | 'password') => {
		setTouched({ ...touched, [field]: true });
		const value = field === 'username' ? username : password;
		const error = validateField(field, value);
		setErrors({ ...errors, [field]: error });
	};

	const handleChange = (field: 'username' | 'password', value: string) => {
		if (field === 'username') {
			setUsername(value);
		} else {
			setPassword(value);
		}

		if (touched[field]) {
			const error = validateField(field, value);
			setErrors({ ...errors, [field]: error });
		}
	};

	const validateForm = () => {
		const usernameError = validateField('username', username);
		const passwordError = validateField('password', password);

		setErrors({
			username: usernameError,
			password: passwordError,
		});
		setTouched({ username: true, password: true });

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

					<button
						type="submit"
						className="w-full bg-primary text-white font-semibold py-2.5 rounded-md hover:bg-primary/80 transition-colors"
					>
						Sign In
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
						Sign in with
						<Icon
							name="42"
							className="size-5 fill-background group-hover:fill-black"
						/>
					</button>
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
