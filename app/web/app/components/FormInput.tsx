import { type ChangeEvent, type FocusEvent } from 'react';

interface FormInputProps {
	id?: string;
	name: string;
	type: 'text' | 'email' | 'password' | 'textarea';
	label: string;
	value: string;
	disabled?: boolean;
	onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
	onBlur?: () => void;
	error?: string;
	touched?: boolean;
	placeholder?: string;
	autoComplete?: string;
	required?: boolean;
	rows?: number;
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
	disabled,
	placeholder,
	autoComplete,
	required = false,
	rows = 3,
}: FormInputProps) {
	const inputId = id || name;
	const errorId = error ? `${inputId}-error` : undefined;

	return (
		<div>
			<label
				htmlFor={inputId}
				className="block text-sm font-semibold text-dark mb-2"
			>
				{label}
			</label>
			{type === 'textarea' ? (
				<textarea
					id={inputId}
					name={name}
					value={value}
					onChange={onChange}
					onBlur={onBlur}
					placeholder={placeholder}
					required={required}
					rows={rows}
					disabled={disabled}
					aria-invalid={touched && error ? 'true' : 'false'}
					aria-describedby={touched && error ? errorId : undefined}
					className={`w-full px-4 py-2.5 rounded-md border ${
						touched && error
							? 'border-red-500 focus:border-red-500'
							: 'border-dark/20 focus:border-primary'
					} focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors`}
				/>
			) : (
				<input
					type={type}
					id={inputId}
					name={name}
					value={value}
					onChange={onChange}
					onBlur={onBlur}
					placeholder={placeholder}
					autoComplete={autoComplete}
					disabled={disabled}
					required={required}
					aria-invalid={touched && error ? 'true' : 'false'}
					aria-describedby={touched && error ? errorId : undefined}
					className={`w-full px-4 py-2.5 rounded-md border ${
						touched && error
							? 'border-red-500 focus:border-red-500'
							: 'border-dark/20 focus:border-primary'
					} focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors`}
				/>
			)}
			{touched && error && (
				<p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}
