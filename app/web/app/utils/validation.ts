export const validationRules = {
	username: (value: string) => {
		if (value.length < 3 || value.length > 15) {
			return 'Username must be between 3 and 15 characters';
		}
		if (!/^[a-zA-Z0-9_]+$/.test(value)) {
			return 'Username can only contain letters, numbers, and underscores';
		}
		return '';
	},

	email: (value: string) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(value)) {
			return 'Please enter a valid email address';
		}
		return '';
	},

	password: (value: string) => {
		if (value.length < 12) {
			return 'Password must be at least 12 characters';
		}
		return '';
	},

	confirmPassword: (value: string, formData?: any) => {
		const passwordField = formData?.newPassword || formData?.password;
		if (value !== passwordField) {
			return 'Passwords do not match';
		}
		return '';
	},

	bio: (value: string) => {
		if (value.length > 300) {
			return 'Bio must be 300 characters or less';
		}
		return '';
	},

	location: (value: string) => {
		if (value.length > 32) {
			return 'Location must be 32 characters or less';
		}
		return '';
	},

	link: (value: string) => {
		if (!value) return '';
		if (value.length > 128) {
			return 'Link must be 128 characters or less';
		}
		return '';
	},

	deleteConfirmation: (value: string, formData?: any) => {
		if (value !== formData?.expectedUsername) {
			return 'Username does not match. Please type your exact username.';
		}
		return '';
	},
};
