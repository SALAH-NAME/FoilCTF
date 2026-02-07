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
		if (value !== formData?.password) {
			return 'Passwords do not match';
		}
		return '';
	},
};
