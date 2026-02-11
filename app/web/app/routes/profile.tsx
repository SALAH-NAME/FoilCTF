import { useState } from 'react';
import type { Route } from './+types/profile';
import Button from '../components/Button';
import StatsCard from '../components/StatsCard';
import AvatarUpload from '../components/AvatarUpload';
import ProfileField from '../components/ProfileField';
import PrivacyToggle from '../components/PrivacyToggle';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import { useFormValidation } from '../hooks/useFormValidation';
import { validationRules } from '../utils/validation';
import Icon from '~/components/Icon';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Profile' }];
}

export default function Page() {
	// TODO: Replace API
	const [isEditing, setIsEditing] = useState(false);
	const [showEmailModal, setShowEmailModal] = useState(false);
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const [profileData, setProfileData] = useState({
		username: 'John_Doe',
		avatar: '',
		email: 'john@example.com',
		challengesSolved: 11,
		eventsParticipated: 6,
		totalPoints: 1250,
		bio: 'Seasoned CTF player with 5+ years grinding jeopardy and attack/defense formats. Rating: 2600+ on CTFtime (top 5%). Solo & team wins at DEF CON "25, HackTheVote "24. Specialize in pwn (ROP chains, heap feng shui), crypto (lattice attacks, side-channels), rev (Ghidra/IDA wizardry).',
		location: 'New York, USA',
		link: 'https://github.com/johndoe',
		isPrivateProfile: false,
	});

	const { errors, touched, handleBlur, handleChange } = useFormValidation({
		username: validationRules.username,
		bio: validationRules.bio,
		location: validationRules.location,
		link: validationRules.link,
	});

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

	const handleEditToggle = () => {
		setIsEditing(!isEditing);

		if (isEditing) {
			// TODO: Reset to original
		}
	};

	const handleSave = () => {
		const usernameError = validationRules.username(profileData.username);
		const bioError = validationRules.bio(profileData.bio);
		const locationError = validationRules.location(profileData.location);
		const linkError = validationRules.link(profileData.link);

		if (!usernameError && !bioError && !locationError && !linkError) {
			// TODO: Send updated data
			setIsEditing(false);
		}
	};

	const handleCancel = () => {
		// TODO: Reset to original data
		setIsEditing(false);
	};

	const handleFieldChange = (field: string, value: string | boolean) => {
		setProfileData((prev) => ({ ...prev, [field]: value }));
		if (typeof value === 'string') {
			handleChange(field, value, {
				username: profileData.username,
				bio: profileData.bio,
				location: profileData.location,
				link: profileData.link,
			});
		}
	};

	const handleFieldBlur = (field: string) => {
		const value = profileData[field as keyof typeof profileData];
		if (typeof value === 'string') {
			handleBlur(field, value, {
				username: profileData.username,
				bio: profileData.bio,
				location: profileData.location,
				link: profileData.link,
			});
		}
	};

	const handleAvatarChange = (file: File | null) => {
		// TODO: Avatar file upload
		console.log('Avatar changed:', file);
	};

	const handleEmailFormChange = (e: React.FormEvent) => {
		e.preventDefault();
		const emailError = validationRules.email(emailForm.newEmail);
		const passwordError = validationRules.password(emailForm.password);

		if (!emailError && !passwordError) {
			// TODO: Handle email change
			setShowEmailModal(false);
			setEmailForm({ newEmail: '', password: '' });
		}
	};

	const handlePasswordFormChange = (e: React.FormEvent) => {
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

	const handleDeleteAccount = (e: React.FormEvent) => {
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

	return (
		<div className="h-full bg-background p-4">
			<div className="max-w-4xl mx-auto space-y-6">
				<div className="bg-white rounded-md border border-dark/10">
					<div className="md:block flex h-32 md:h-40 px-6 justify-center bg-gradient-to-r from-primary to-secondary rounded-t-sm">
						<div className="absolute ring-4 ring-white rounded-full translate-y-1/2">
							<AvatarUpload
								username={profileData.username}
								currentAvatar={profileData.avatar}
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
						value={profileData.challengesSolved}
						label="Challenges Solved"
					/>
					<StatsCard
						value={profileData.eventsParticipated}
						label="Events Participated In"
					/>
					<StatsCard value={profileData.totalPoints} label="Total Points" />
				</div>

				<div className="bg-white rounded-md p-6 md:p-8 border border-dark/10">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-bold text-dark">
							Profile Information
						</h2>
						{!isEditing ? (
							<button
								type="button"
								onClick={handleEditToggle}
								className="p-2 text-white hover:text-dark hover:bg-dark/5  rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
								aria-label="Edit profile information"
							>
								<Icon
									name="edit"
									className="size-5 shrink-0"
									aria-hidden={true}
								/>
							</button>
						) : (
							<div className="flex gap-2">
								<Button
									variant="secondary"
									onClick={handleCancel}
									type="button"
									size="sm"
								>
									Cancel
								</Button>
								<Button onClick={handleSave} type="button" size="sm">
									Save
								</Button>
							</div>
						)}
					</div>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							handleSave();
						}}
						className="space-y-4"
					>
						<ProfileField
							id="username"
							label="Username"
							value={profileData.username}
							isEditing={isEditing}
							onChange={(value) => handleFieldChange('username', value)}
							onBlur={() => handleFieldBlur('username')}
							error={errors.username}
							touched={touched.username}
							maxLength={15}
						/>
						<ProfileField
							id="bio"
							label="Bio"
							value={profileData.bio}
							isEditing={isEditing}
							type="textarea"
							onChange={(value) => handleFieldChange('bio', value)}
							onBlur={() => handleFieldBlur('bio')}
							error={errors.bio}
							touched={touched.bio}
							maxLength={300}
						/>
						<ProfileField
							id="location"
							label="Location"
							value={profileData.location}
							isEditing={isEditing}
							onChange={(value) => handleFieldChange('location', value)}
							onBlur={() => handleFieldBlur('location')}
							error={errors.location}
							touched={touched.location}
							maxLength={32}
						/>
						<ProfileField
							id="link"
							label="Website / Social Link"
							value={profileData.link}
							isEditing={isEditing}
							type="url"
							onChange={(value) => handleFieldChange('link', value)}
							onBlur={() => handleFieldBlur('link')}
							error={errors.link}
							touched={touched.link}
							maxLength={128}
						/>
						<PrivacyToggle
							id="isPrivateProfile"
							label="Private Profile"
							checked={profileData.isPrivateProfile}
							isEditing={isEditing}
							onChange={(value) => handleFieldChange('isPrivateProfile', value)}
							description="Hide your profile from other users"
						/>
					</form>
				</div>

				<div className="bg-white rounded-md p-6 md:p-8 border border-dark/10">
					<h2 className="text-2xl font-bold text-dark mb-6">
						Account Settings
					</h2>
					<div className="space-y-4">
						<div className="flex flex-row pb-4  items-center justify-between border-b border-dark/10">
							<div className="h-5 flex flex-col pr-4 gap-2 justify-left">
								<h3 className="text-sm font-semibold text-dark leading-0">
									Email
								</h3>
								<p className="text-dark/60">{profileData.email}</p>
							</div>
							<Button
								variant="secondary"
								size="sm"
								type="button"
								className="w-22"
								onClick={() => setShowEmailModal(true)}
							>
								Change
							</Button>
						</div>
						<div className="flex flex-row pb-4 items-center justify-between border-b border-dark/10">
							<h3 className="text-sm font-semibold text-dark leading-0 pr-4">
								Password
							</h3>
							<Button
								variant="secondary"
								size="sm"
								type="button"
								className="w-22"
								onClick={() => setShowPasswordModal(true)}
							>
								Change
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
								className="w-22"
								onClick={() => setShowDeleteModal(true)}
							>
								Delete
							</Button>
						</div>
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
				<form
					id="email-form"
					onSubmit={handleEmailFormChange}
					className="space-y-4"
				>
					<FormInput
						id="new-email"
						name="email"
						type="email"
						label="New Email Address"
						value={emailForm.newEmail}
						onChange={(value) => {
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
						onChange={(value) => {
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
				</form>
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
						onChange={(value) => {
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
						onChange={(value) => {
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
						onChange={(value) => {
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
								onChange={(value) => {
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
							onChange={(value) =>
								setDeleteForm((prev) => ({ ...prev, password: value }))
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
