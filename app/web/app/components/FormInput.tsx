import { type ChangeEvent, type FocusEvent } from 'react';

interface FormInputProps {
	id: string;
	name: string;
	type: 'text' | 'email' | 'password';
	label: string;
	value: string;
	onChange: (value: string) => void;
	onBlur: () => void;
	error?: string;
	touched?: boolean;
	placeholder?: string;
	autoComplete?: string;
	required?: boolean;
}

export default function FormInput({
	id,
	name,
	type,
	label,
	value,
	onChange,
	onBlur,
	error,
	touched,
	placeholder,
	autoComplete,
	required = false,
}: FormInputProps) {
	const errorId = error ? `${id}-error` : undefined;

	return (
		<div>
			<label
				htmlFor={id}
				className="block text-sm font-semibold text-dark mb-2"
			>
				{label}
			</label>
			<input
				type={type}
				id={id}
				name={name}
				value={value}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					onChange(e.target.value)
				}
				onBlur={onBlur}
				placeholder={placeholder}
				autoComplete={autoComplete}
				required={required}
				aria-invalid={touched && error ? 'true' : 'false'}
				aria-describedby={touched && error ? errorId : undefined}
				className={`w-full px-4 py-2.5 rounded-md border ${
					touched && error
						? 'border-red-500 focus:border-red-500'
						: 'border-dark/20 focus:border-primary'
				} focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors`}
			/>
			{touched && error && (
				<p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}
