import { useState, useCallback } from 'react';

type ValidationRules = {
	[key: string]: (value: string, formData?: any) => string;
};

export function useFormValidation<T extends Record<string, string>>(
	validationRules: ValidationRules
) {
	const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
	const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

	const validateField = useCallback(
		(name: keyof T, value: string, formData?: T) => {
			const validator = validationRules[name as string];
			if (!validator) return '';
			return validator(value, formData);
		},
		[validationRules]
	);

	const handleBlur = useCallback(
		(field: keyof T, value: string, formData?: T) => {
			setTouched((prev) => ({ ...prev, [field]: true }));
			const error = validateField(field, value, formData);
			setErrors((prev) => ({ ...prev, [field]: error }));
		},
		[validateField]
	);

	const handleChange = useCallback(
		(field: keyof T, value: string, formData?: T) => {
			if (touched[field]) {
				const error = validateField(field, value, formData);
				setErrors((prev) => ({ ...prev, [field]: error }));
			}
		},
		[touched, validateField]
	);

	const resetValidation = useCallback(() => {
		setErrors({});
		setTouched({});
	}, []);

	return {
		errors,
		touched,
		handleBlur,
		handleChange,
		resetValidation,
	};
}
