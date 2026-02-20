import { type ChangeEvent } from 'react';

interface SelectOption {
	value: string;
	label: string;
}

interface FormSelectProps {
	id?: string;
	name: string;
	label: string;
	value: string;
	onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
	onBlur?: () => void;
	error?: string;
	touched?: boolean;
	required?: boolean;
	disabled?: boolean;
	options: SelectOption[];
	placeholder?: string;
}

export default function FormSelect({
	id,
	name,
	label,
	value,
	onChange,
	onBlur,
	error,
	touched,
	required = false,
	disabled = false,
	options,
	placeholder,
}: FormSelectProps) {
	const selectId = id || name;
	const errorId = error ? `${selectId}-error` : undefined;

	return (
		<div>
			<label
				htmlFor={selectId}
				className="block text-sm font-semibold text-dark mb-2"
			>
				{label}
			</label>
			<select
				id={selectId}
				name={name}
				value={value}
				onChange={onChange}
				onBlur={onBlur}
				required={required}
				disabled={disabled}
				aria-invalid={touched && error ? 'true' : 'false'}
				aria-describedby={touched && error ? errorId : undefined}
				className={`w-full px-4 py-2.5 rounded-md border ${
					touched && error
						? 'border-red-500 focus:border-red-500'
						: 'border-dark/20 focus:border-primary'
				} focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors bg-white`}
			>
				{placeholder && (
					<option value="" disabled>
						{placeholder}
					</option>
				)}
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			{touched && error && (
				<p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}
