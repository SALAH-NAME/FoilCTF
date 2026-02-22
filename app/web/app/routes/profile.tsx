import { data, redirect, Form } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useContext, useEffect, useState, type SubmitEvent } from 'react';

import type { Route } from './+types/profile';

import { useToast } from '~/contexts/ToastContext';
import { UserContext } from '~/contexts/UserContext';
import { validationRules } from '~/utils/validation';
import { useFormValidation } from '~/hooks/useFormValidation';
import { commitSession, request_session } from '~/session.server';

import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import FormInput from '~/components/FormInput';
import StatsCard from '~/components/StatsCard';
import AvatarUpload from '~/components/AvatarUpload';
import ProfileField from '~/components/ProfileField';
import PrivacyToggle from '~/components/PrivacyToggle';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Profile' }];
}

export async function loader({ request }: Route.LoaderArgs) {
	const session = await request_session(request);

	const user = session.get('user')!;
	return user;
}

async function update_email(
	token: string,
	username: string,
	password: string,
	email: string
) {
	const uri = new URL(
		`/api/users/${username}`,
		import.meta.env.VITE_REST_USER_ORIGIN
	);
	const res = await fetch(uri, {
		method: 'PUT',
		headers: new Headers({
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json',
		}),

		body: JSON.stringify({ email, password }),
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response content type');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');

	type JSONData_Session = {
		token_access: string;
		token_refresh: string;
		expiry: string;
	};
	return json as JSONData_Session;
}
export async function action({ request }: Route.ActionArgs) {
	const session = await request_session(request);
	const user_active = session.get('user')!;

	try {
		const form_data = await request.formData();
		const input_email = form_data.get('email');
		const input_password = form_data.get('password');

		if (typeof input_email !== 'string' || !input_email)
			throw new Error('Invalid email');
		if (typeof input_password !== 'string' || !input_password)
			throw new Error('Invalid password');

		const result = await update_email(
			user_active.token_access,
			user_active.username,
			input_password,
			input_email
		);
		const user_next = structuredClone(user_active);

		user_next.token_access = result.token_access;
		user_next.token_refresh = result.token_refresh;
		user_next.expiry = result.expiry;
		session.set('user', user_next);

		return redirect('/profile', {
			headers: new Headers({ 'Set-Cookie': await commitSession(session) }),
		});
	} catch (err) {
		return data({
			error:
				(err instanceof Error ? err.message : err?.toString()) ??
				'Internal server error',
			timestamp: Date.now(),
		});
	}
}

async function fetch_profile(token: string, username: string) {
	const uri = new URL(
		`/api/profiles/${username}`,
		import.meta.env.VITE_REST_USER_ORIGIN
	);
	const res = await fetch(uri, {
		headers: new Headers({ Authorization: `Bearer ${token}` }),
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (!res.ok || content_type !== 'application/json') return null;

	const json = await res.json();
	type JSONData_Profile = {
		avatar: string;
		username: string;

		challenges_solved: number | null;
		events_participated: number | null;
		total_points: number | null;

		bio: string | null | undefined;
		location: string | null | undefined;
		social_media_links: string | null | undefined;
	};
	return json as JSONData_Profile;
}
async function fetch_user(token: string) {
	const uri = new URL(`/api/users/me`, import.meta.env.VITE_REST_USER_ORIGIN);
	const res = await fetch(uri, {
		headers: new Headers({ Authorization: `Bearer ${token}` }),
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (!res.ok || content_type !== 'application/json') return null;

	const json = await res.json();
	type JSONData_User = {
		id: number;
		email: string | null;
		username: string;
		role: string;

		profileId: number | null;
		oauth42_login: string | null;

		createdAt: string;
		bannedUntil: string | null;
	};
	return json as JSONData_User;
}
export default function Page({ loaderData, actionData }: Route.ComponentProps) {
	const { addToast } = useToast();
	const { username, token_access } = loaderData;

	const [profileData, setProfileData] = useState<{
		username: string;
		avatar?: string;
		email?: string | null;

		bio?: string | null;
		location?: string | null;
		link?: string | null;

		isPrivateProfile: boolean;
		['42login']?: string | null;
	}>({
		username: username,
		isPrivateProfile: false,
	});

	const queryProfile = useQuery({
		queryKey: ['profile', { username }, { token_access }],
		initialData: null,
		async queryFn() {
			const profile = await fetch_profile(token_access, username);
			return profile;
		},
	});
	const queryUser = useQuery({
		queryKey: ['user', { username }, { token_access }],
		initialData: null,
		queryFn: async () => {
			const user = await fetch_user(token_access);
			return user;
		},
	});

	useEffect(() => {
		const user = queryUser.data;
		if (!queryUser.isSuccess || !user) return;

		setProfileData((oldProfileData) => {
			const newProfileData = {
				...oldProfileData,

				username: user.username,
				email: user.email ?? 'No Email',
				['42login']: user.oauth42_login,
			};
			return newProfileData;
		});
	}, [queryUser.dataUpdatedAt, queryUser.status]);
	useEffect(() => {
		const profile = queryProfile.data;
		if (!queryProfile.isSuccess || !profile) return;

		setProfileData((oldProfileData) => {
			const newProfileData = {
				...oldProfileData,

				avatar: profile.avatar ?? '',

				bio: profile.bio ?? '',
				location: profile.location ?? '',
				link: profile.social_media_links ?? '',
			};
			return newProfileData;
		});
	}, [queryProfile.dataUpdatedAt, queryProfile.status]);

	const [showEmailModal, setShowEmailModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showPasswordModal, setShowPasswordModal] = useState(false);

	const [emailForm, setEmailForm] = useState({
		newEmail: '',
		password: '',
	});
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});
	const [deleteForm, setDeleteForm] = useState({
		confirmation: '',
		password: '',
	});

	const { logoutUserState, refreshUserState } = useContext(UserContext)!;

	useEffect(() => {
		// NOTE(xenobas): useQuery error reporting via toasts
		const error = queryProfile.error;
		if (!error) return;

		addToast({
			variant: 'error',
			title: 'Could not query profile',
			message: error.message || 'Internal server error',
		});
		console.error(error);
	}, [queryProfile.errorUpdateCount, queryProfile.errorUpdatedAt]);
	useEffect(() => {
		if (!actionData?.error) return;

		addToast({
			variant: 'error',
			title: 'Email update failed',
			message: actionData.error,
		});
	}, [actionData?.error, actionData?.timestamp]);

	const {
		errors: emailErrors,
		touched: emailTouched,
		handleBlur: handleEmailBlur,
		handleChange: handleEmailChange,
	} = useFormValidation({
		email: validationRules.email,
		password: validationRules.password,
	});

	const {
		errors: passwordErrors,
		touched: passwordTouched,
		handleBlur: handlePasswordBlur,
		handleChange: handlePasswordChange,
	} = useFormValidation({
		currentPassword: validationRules.password,
		newPassword: validationRules.password,
		confirmPassword: validationRules.confirmPassword,
	});

	const {
		errors: deleteErrors,
		touched: deleteTouched,
		handleBlur: handleDeleteBlur,
		handleChange: handleDeleteChange,
	} = useFormValidation({
		confirmation: validationRules.deleteConfirmation,
	});

	const handleAvatarChange = (file: File | null) => {
		// TODO: Avatar file upload
		console.log('Avatar changed:', file);
	};
	const handlePasswordFormChange = (e: SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		const currentPasswordError = validationRules.password(
			passwordForm.currentPassword
		);
		const newPasswordError = validationRules.password(passwordForm.newPassword);
		const confirmPasswordError = validationRules.confirmPassword(
			passwordForm.confirmPassword,
			passwordForm
		);

		if (!currentPasswordError && !newPasswordError && !confirmPasswordError) {
			// TODO: Handle password change
			setShowPasswordModal(false);
			setPasswordForm({
				currentPassword: '',
				newPassword: '',
				confirmPassword: '',
			});
		}
	};

	const handleEmailFormSubmit = (e: SubmitEvent<HTMLFormElement>) => {
		const validations = [
			validationRules.email(emailForm.newEmail),
			validationRules.password(emailForm.password),
		];
		for (const valid of validations) {
			if (!valid) continue;

			e.preventDefault();
			break;
		}
	};

	const handleDeleteAccount = (e: SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		const confirmationError = validationRules.deleteConfirmation(
			deleteForm.confirmation,
			{ expectedUsername: profileData.username }
		);

		if (!confirmationError) {
			// TODO: Handle account deletion
			console.log('Account deleted');
			setShowDeleteModal(false);
			setDeleteForm({ confirmation: '', password: '' });
		}
	};

	const handleOAuth42Link = async () => {
		const location = window.location;
		const location_search = new URLSearchParams(location.search);

		const uri_redirect = new URL(
			'/oauth/42',
			location.protocol + '//' + location.host
		);
		const uri_redirect_prev = location_search.get('redirect_uri');
		if (uri_redirect_prev)
			uri_redirect.searchParams.set('redirect_uri', uri_redirect_prev);

		const uri_oauth = new URL(
			'/api/oauth/42/link',
			import.meta.env.VITE_REST_USER_ORIGIN
		);
		uri_oauth.searchParams.set('redirect_uri', uri_redirect.toString());
		uri_oauth.searchParams.set('token', token_access);

		window.location.href = uri_oauth.toString();
	};
	const handleOAuth42Unlink = async () => {
		addToast({
			variant: 'warning',

			title: 'Not implemented',
			message: 'Unlinking is WIP',
		});
	};

	const fields = {
		isprivate: profileData.isPrivateProfile,
		username: profileData.username,

		bio: profileData.bio,
		socialmedialinks: profileData.link,
		location: profileData.location,
	};
	return (
		<div className="h-full bg-background p-4">
			<div className="max-w-4xl mx-auto space-y-6">
				<div className="bg-white rounded-md border border-dark/10">
					<div className="md:block flex h-32 md:h-40 px-6 justify-center bg-linear-to-r from-primary to-secondary rounded-t-sm">
						<div className="absolute ring-4 ring-white rounded-full translate-y-1/2">
							<AvatarUpload
								username={profileData.username}
								currentAvatar={profileData.avatar ?? undefined}
								onAvatarChange={handleAvatarChange}
							/>
						</div>
					</div>
					<div className="px-6 md:px-8 pb-6 md:pb-8">
						<div className="flex flex-col md:flex-row items-center md:items-end gap-6">
							<div className="flex-1 text-center md:text-left md:pb-2 md:mt-4 mt-16 md:ml-44 ">
								<h1 className="text-3xl md:text-4xl font-bold text-dark mb-1">
									{profileData.username}
								</h1>
								{profileData.bio && (
									<p className="text-dark/70 mb-3 max-w-2xl text-sm">
										{profileData.bio}
									</p>
								)}
								<div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-dark/60">
									{profileData.location && (
										<span className="flex items-center gap-1">
											<Icon
												name="location"
												className="size-4 shrink-0"
												aria-hidden={true}
											/>
											<span>{profileData.location}</span>
										</span>
									)}
									{profileData.link && (
										<p
											rel="noopener noreferrer"
											className="flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
										>
											<Icon
												name="link"
												className="size-4 shrink-0"
												aria-hidden={true}
											/>
											<span className="truncate max-w-xs">
												{profileData.link}
											</span>
										</p>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				<div
					className="grid grid-cols-1 md:grid-cols-3 gap-4"
					role="region"
					aria-label="Profile Statistics"
				>
					<StatsCard
						value={queryProfile.data?.challenges_solved ?? 0}
						label="Challenges Solved"
					/>
					<StatsCard
						value={queryProfile.data?.events_participated ?? 0}
						label="Events Participated In"
					/>
					<StatsCard
						value={queryProfile.data?.total_points ?? 0}
						label="Total Points"
					/>
				</div>

				<SectionProfileInfo
					credentials={{ username, token: token_access }}
					fields={fields}
					errors={{}}
				/>

				<div className="bg-white rounded-md p-6 md:p-8 border border-dark/10">
					<h2 className="text-2xl font-bold text-dark mb-6">
						Account Settings
					</h2>
					<div className="space-y-4">
						<div className="flex flex-row items-center justify-between pb-4 border-b border-dark/10">
							<div className="h-5 flex flex-col pr-4 gap-2 justify-left">
								<h3 className="text-sm font-semibold text-dark leading-0">
									Email
								</h3>
								<p className="text-dark/60">{profileData.email}</p>
							</div>
							<Button
								variant="primary"
								size="sm"
								type="button"
								className="w-24"
								onClick={() => setShowEmailModal(true)}
							>
								Change
							</Button>
						</div>
						<div className="flex flex-row items-center justify-between pb-4 border-b border-dark/10">
							<h3 className="text-sm font-semibold text-dark leading-0 pr-4">
								Password
							</h3>
							<Button
								variant="primary"
								size="sm"
								type="button"
								className="w-24"
								onClick={() => setShowPasswordModal(true)}
							>
								Change
							</Button>
						</div>
						<div className="flex flex-row items-center justify-between pb-4 border-b border-dark/10">
							<span></span>
							<Button
								variant="secondary"
								size="sm"
								type="button"
								className="w-24"
								onClick={logoutUserState}
							>
								Sign out
							</Button>
						</div>
						<div className="flex flex-row items-center justify-between pb-4 border-b border-dark/10">
							<span></span>
							<Button
								variant="ghost"
								size="sm"
								type="button"
								className="w-24"
								onClick={refreshUserState}
							>
								Refresh
							</Button>
						</div>
						<div className="flex flex-row items-center justify-between">
							<h3 className="text-sm font-semibold text-dark leading-0 pr-4">
								Delete Account
							</h3>
							<Button
								variant="danger"
								size="sm"
								type="button"
								className="w-24"
								onClick={() => setShowDeleteModal(true)}
							>
								Delete
							</Button>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-md p-6 md:p-8 border border-dark/10">
					<img src="/42.svg" alt="42 Network" className="h-10 mb-6" />
					<div className="space-y-4">
						{profileData['42login'] ? (
							<div className="flex flex-row items-center justify-between">
								<h3 className="text-sm font-semibold text-dark leading-0 pr-4">
									Linked to member{' '}
									<span className="font-mono">
										{profileData['42login']}
									</span>{' '}
								</h3>
								<Button
									variant="danger"
									size="sm"
									type="button"
									className="w-24"
									onClick={handleOAuth42Unlink}
								>
									Unlink
								</Button>
							</div>
						) : (
							<div className="flex flex-row items-center justify-between">
								<h3 className="text-sm font-semibold text-dark leading-0 pr-4">
									This account is not linked
								</h3>
								<Button
									variant="oauth"
									size="sm"
									type="button"
									className="w-24"
									onClick={handleOAuth42Link}
								>
									Link
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>

			<Modal
				isOpen={showEmailModal}
				onClose={() => setShowEmailModal(false)}
				title="Change Email Address"
				footer={
					<div className="flex gap-3 justify-end">
						<Button
							variant="secondary"
							onClick={() => setShowEmailModal(false)}
							type="button"
						>
							Cancel
						</Button>
						<Button type="submit" form="email-form">
							Update Email
						</Button>
					</div>
				}
			>
				<Form
					id="email-form"
					action="/profile"
					method="post"
					onSubmit={handleEmailFormSubmit}
					className="space-y-4"
				>
					<input type="hidden" name="kind" value="email" />
					<FormInput
						id="new-email"
						name="email"
						type="email"
						label="New Email Address"
						value={emailForm.newEmail}
						onChange={(e) => {
							const value = e.target.value;
							setEmailForm((prev) => ({ ...prev, newEmail: value }));
							handleEmailChange('email', value, emailForm);
						}}
						onBlur={() =>
							handleEmailBlur('email', emailForm.newEmail, emailForm)
						}
						error={emailErrors.email}
						touched={emailTouched.email}
						placeholder="newemail@example.com"
						required
					/>
					<FormInput
						id="email-password"
						name="password"
						type="password"
						label="Current Password"
						value={emailForm.password}
						onChange={(e) => {
							const value = e.target.value;
							setEmailForm((prev) => ({ ...prev, password: value }));
							handleEmailChange('password', value, emailForm);
						}}
						onBlur={() =>
							handleEmailBlur('password', emailForm.password, emailForm)
						}
						error={emailErrors.password}
						touched={emailTouched.password}
						placeholder="Enter your password to confirm"
						required
					/>
				</Form>
			</Modal>

			<Modal
				isOpen={showPasswordModal}
				onClose={() => setShowPasswordModal(false)}
				title="Change Password"
				footer={
					<div className="flex gap-3 justify-end">
						<Button
							variant="secondary"
							onClick={() => setShowPasswordModal(false)}
							type="button"
						>
							Cancel
						</Button>
						<Button type="submit" form="password-form">
							Update Password
						</Button>
					</div>
				}
			>
				<form
					id="password-form"
					onSubmit={handlePasswordFormChange}
					className="space-y-4"
				>
					<FormInput
						id="current-password"
						name="currentPassword"
						type="password"
						label="Current Password"
						value={passwordForm.currentPassword}
						onChange={(e) => {
							const value = e.target.value;
							setPasswordForm((prev) => ({ ...prev, currentPassword: value }));
							handlePasswordChange('currentPassword', value, passwordForm);
						}}
						onBlur={() =>
							handlePasswordBlur(
								'currentPassword',
								passwordForm.currentPassword,
								passwordForm
							)
						}
						error={passwordErrors.currentPassword}
						touched={passwordTouched.currentPassword}
						required
					/>
					<FormInput
						id="new-password"
						name="newPassword"
						type="password"
						label="New Password"
						value={passwordForm.newPassword}
						onChange={(e) => {
							const value = e.target.value;
							setPasswordForm((prev) => ({ ...prev, newPassword: value }));
							handlePasswordChange('newPassword', value, passwordForm);
						}}
						onBlur={() =>
							handlePasswordBlur(
								'newPassword',
								passwordForm.newPassword,
								passwordForm
							)
						}
						error={passwordErrors.newPassword}
						touched={passwordTouched.newPassword}
						placeholder="Minimum 12 characters"
						required
					/>
					<FormInput
						id="confirm-password"
						name="confirmPassword"
						type="password"
						label="Confirm New Password"
						value={passwordForm.confirmPassword}
						onChange={(e) => {
							const value = e.target.value;
							setPasswordForm((prev) => ({ ...prev, confirmPassword: value }));
							handlePasswordChange('confirmPassword', value, passwordForm);
						}}
						onBlur={() =>
							handlePasswordBlur(
								'confirmPassword',
								passwordForm.confirmPassword,
								passwordForm
							)
						}
						error={passwordErrors.confirmPassword}
						touched={passwordTouched.confirmPassword}
						required
					/>
				</form>
			</Modal>

			<Modal
				isOpen={showDeleteModal}
				onClose={() => {
					setShowDeleteModal(false);
					setDeleteForm({ confirmation: '', password: '' });
				}}
				title="Delete Account"
				size="md"
				footer={
					<div className="flex gap-3 justify-end">
						<Button
							variant="secondary"
							onClick={() => setShowDeleteModal(false)}
							type="button"
						>
							Cancel
						</Button>
						<Button variant="danger" type="submit" form="delete-form">
							Delete My Account
						</Button>
					</div>
				}
			>
				<div className="space-y-4">
					<div
						className="bg-red-50 border border-red-200 rounded-md p-4"
						role="alert"
					>
						<div className="flex gap-3">
							<Icon
								name="warning"
								className="size-6 shrink-0 text-red-600"
								aria-hidden={true}
							/>
							<div>
								<h4 className="font-semibold text-red-900 mb-1">
									Warning: This action cannot be undone
								</h4>
								<p className="text-sm text-red-800">
									Deleting your account will permanently remove all your data,
									including challenges solved, event participation, and points.
								</p>
							</div>
						</div>
					</div>
					<form
						id="delete-form"
						onSubmit={handleDeleteAccount}
						className="space-y-4"
					>
						<div>
							<label
								htmlFor="delete-confirmation"
								className="block text-sm font-semibold text-dark mb-2"
							>
								Type your username{' '}
								<span className="font-mono text-primary">
									{profileData.username}
								</span>{' '}
								to confirm
							</label>
							<FormInput
								id="delete-confirmation"
								name="confirmation"
								type="text"
								label=""
								value={deleteForm.confirmation}
								onChange={(e) => {
									const value = e.target.value;
									setDeleteForm((prev) => ({
										...prev,
										confirmation: value,
									}));
									handleDeleteChange('confirmation', value, {
										expectedUsername: profileData.username,
									});
								}}
								onBlur={() =>
									handleDeleteBlur('confirmation', deleteForm.confirmation, {
										expectedUsername: profileData.username,
									})
								}
								error={deleteErrors.confirmation}
								touched={deleteTouched.confirmation}
								placeholder="Enter your username"
								required
							/>
							<p className="text-xs text-dark/50 mt-1">
								This is to ensure you want to delete your account
							</p>
						</div>
						<FormInput
							id="delete-password"
							name="password"
							type="password"
							label="Current Password"
							value={deleteForm.password}
							onChange={(e) =>
								setDeleteForm((prev) => ({ ...prev, password: e.target.value }))
							}
							onBlur={() => {}}
							placeholder="Enter your password"
							required
						/>
					</form>
				</div>
			</Modal>
		</div>
	);
}

interface ProfileInfoProps {
	fields: {
		username: string;
		isprivate: boolean;

		bio?: string | null;
		location?: string | null;
		socialmedialinks?: string | null;
	};
	errors: {
		[k in keyof ProfileInfoProps['fields']]?: string;
	};
	credentials: {
		username: string;
		token: string;
	};
}

async function update_profile_information(
	token: string,
	username: string,
	info: any
) {
	const uri = new URL(
		`/api/profiles/${username}`,
		import.meta.env.VITE_REST_USER_ORIGIN
	);
	const res = await fetch(uri, {
		method: 'PUT',
		headers: new Headers({
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json',
		}),

		body: JSON.stringify(info),
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (!res.ok) {
		if (content_type !== 'application/json')
			throw new Error('Unexpected response content type');

		const json = await res.json();
		throw new Error(json.error ?? 'Internal server error');
	}
}
function SectionProfileInfo({ credentials, fields, errors }: ProfileInfoProps) {
	const queryClient = useQueryClient();
	const { addToast } = useToast();

	type MutUpdateVariables = Partial<{
		isprivate: boolean;
		bio: string | null;
		location: string | null;
		socialmedialinks: string | null;
	}>;
	const mutUpdate = useMutation<boolean, Error, MutUpdateVariables, unknown>({
		async mutationFn(variables) {
			const _keys = Object.keys(variables);
			if (_keys.length === 0) return false;

			await update_profile_information(
				credentials.token,
				credentials.username,
				variables
			);
			return true;
		},

		async onSuccess(did_update) {
			setModeEdit(false);
			if (!did_update) return;

			addToast({
				variant: 'success',
				title: 'Profile Information',
				message: 'Updated your personal information',
			});
			queryClient.invalidateQueries({
				queryKey: ['profile', { username: credentials.username }],
			});
		},
		async onError(err) {
			addToast({
				variant: 'error',
				title: 'Could not update profile information',
				message: err.message,
			});
		},
	});
	const [is_mode_edit, setModeEdit] = useState(false);
	const [editedFields, setEditedFields] = useState(fields);
	useEffect(() => {
		setEditedFields(fields);
	}, [fields]);

	const enableModeEdit = () => setModeEdit(true);
	const resetModeEdit = () => {
		setEditedFields(structuredClone(fields));
		setModeEdit(false);
	};
	const submitModeEdit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (mutUpdate.isPending) return;
		if (false)
			// TODO(xenobas): Run validation logic
			return;

		const variables: MutUpdateVariables = {};
		let key: keyof typeof editedFields;
		for (key in editedFields) {
			if (key === 'username') continue;
			if (editedFields[key] === fields[key]) continue;
			variables[key] = editedFields[key] as any;
		}

		mutUpdate.mutate(variables);
	};

	interface FieldValueMapping {
		username: string;
		isprivate: boolean;

		bio: string;
		location: string;
		socialmedialinks: string;
	}
	function changeField<T extends keyof FieldValueMapping>(field: T) {
		return (value: FieldValueMapping[T]): void => {
			setEditedFields((fields) => {
				const editedFields = structuredClone(fields);

				editedFields[field] = value;
				return editedFields;
			});
		};
	}
	function blurField(_field: keyof FieldValueMapping) {
		// TODO(xenobas): This stuff ain't it.
		return (): void => {};
	}

	return (
		<div className="bg-white rounded-md p-6 md:p-8 border border-dark/10">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-dark">Profile Information</h2>
				{!is_mode_edit ? (
					<button
						type="button"
						onClick={enableModeEdit}
						className="p-2 text-white hover:text-dark hover:bg-dark/5  rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
						aria-label="Edit profile information"
					>
						<Icon name="edit" className="size-5 shrink-0" aria-hidden={true} />
					</button>
				) : (
					<div className="flex gap-2">
						<Button
							variant="secondary"
							onClick={resetModeEdit}
							type="button"
							size="sm"
						>
							Cancel
						</Button>
						<Button type="submit" size="sm" form="form-profile-info">
							Save
						</Button>
					</div>
				)}
			</div>
			<form
				id="form-profile-info"
				className="space-y-4"
				onSubmit={submitModeEdit}
			>
				<ProfileField
					id="username"
					label="Username"
					value={editedFields.username}
					isEditing={false}
					onChange={changeField('username')}
					onBlur={blurField('username')}
					error={errors.username}
					maxLength={15}
				/>
				<ProfileField
					id="bio"
					label="Bio"
					value={editedFields.bio ?? ''}
					isEditing={is_mode_edit}
					type="textarea"
					onChange={changeField('bio')}
					onBlur={blurField('bio')}
					error={errors.bio}
					maxLength={300}
				/>
				<ProfileField
					id="location"
					label="Location"
					value={editedFields.location ?? ''}
					isEditing={is_mode_edit}
					onChange={changeField('location')}
					onBlur={blurField('location')}
					error={errors.location}
					maxLength={32}
				/>
				<ProfileField
					id="link"
					type="url"
					label="Website / Social Link"
					value={editedFields.socialmedialinks ?? ''}
					isEditing={is_mode_edit}
					onChange={changeField('socialmedialinks')}
					onBlur={blurField('socialmedialinks')}
					error={errors.socialmedialinks}
					maxLength={128}
				/>
				<PrivacyToggle
					id="isPrivateProfile"
					label="Private Profile"
					checked={editedFields.isprivate}
					isEditing={is_mode_edit}
					onChange={changeField('isprivate')}
					description="Hide your profile from other users"
				/>
			</form>
		</div>
	);
}
