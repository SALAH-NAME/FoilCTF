import type { ChangeEvent } from 'react';

interface ProfileFieldProps {
	id: string;
	label: string;
	value: string;
	isEditing: boolean;
	type?: 'text' | 'email' | 'url' | 'textarea';
	onChange?: (value: string) => void;
	onBlur?: () => void;
	maxLength?: number;
	error?: string;
	touched?: boolean;
}

export default function ProfileField({
	id,
	label,
	value,
	isEditing,
	type = 'text',
	onChange,
	onBlur,
	maxLength,
	error,
	touched,
}: ProfileFieldProps) {
	const handleChange = (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		if (onChange) {
			onChange(e.target.value);
		}
	};

	const errorId = error && touched ? `${id}-error` : undefined;

	return (
		<div className="pb-4 border-b border-dark/10">
			<label
				htmlFor={id}
				className="block text-sm font-semibold text-dark mb-1"
			>
				{label}
			</label>
			{isEditing ? (
				<>
					{type === 'textarea' ? (
						<textarea
							id={id}
							name={id}
							value={value}
							onChange={handleChange}
							onBlur={onBlur}
							maxLength={maxLength}
							rows={4}
							className={`w-full px-3 py-2 rounded-md border ${
								touched && error
									? 'border-red-500 focus:border-red-500'
									: 'border-dark/20 focus:border-primary'
							} focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors resize-none`}
							aria-label={label}
							aria-invalid={touched && error ? 'true' : 'false'}
							aria-describedby={errorId}
						/>
					) : (
						<input
							type={type}
							id={id}
							name={id}
							value={value}
							onChange={handleChange}
							onBlur={onBlur}
							maxLength={maxLength}
							className={`w-full px-3 py-2 rounded-md border ${
								touched && error
									? 'border-red-500 focus:border-red-500'
									: 'border-dark/20 focus:border-primary'
							} focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors`}
							aria-label={label}
							aria-invalid={touched && error ? 'true' : 'false'}
							aria-describedby={errorId}
						/>
					)}
					{touched && error && (
						<p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
							{error}
						</p>
					)}
				</>
			) : (
				<p className="text-dark/60" id={`${id}-value`}>
					{value || 'Not set'}
				</p>
			)}
		</div>
	);
}
