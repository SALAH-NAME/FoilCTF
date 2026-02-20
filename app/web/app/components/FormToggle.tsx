interface FormToggleProps {
	id?: string;
	name: string;
	label: string;
	description?: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
}

export default function FormToggle({
	id,
	name,
	label,
	description,
	checked,
	onChange,
	disabled = false,
}: FormToggleProps) {
	const toggleId = id || name;

	return (
		<div className="flex items-center justify-between gap-4">
			<div className="flex-1">
				<label
					htmlFor={toggleId}
					className="text-sm font-semibold text-dark cursor-pointer"
				>
					{label}
				</label>
				{description && (
					<p className="text-xs text-muted mt-0.5">{description}</p>
				)}
			</div>
			<button
				type="button"
				id={toggleId}
				role="switch"
				aria-checked={checked}
				aria-label={label}
				disabled={disabled}
				onClick={() => onChange(!checked)}
				className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
					checked ? 'bg-primary' : 'bg-dark/20'
				} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
			>
				<span className="sr-only">{label}</span>
				<span
					className={`absolute h-4 w-4 transform rounded-full bg-white transition-transform ${
						checked ? 'translate-x-3' : '-translate-x-3'
					}`}
				/>
			</button>
		</div>
	);
}
