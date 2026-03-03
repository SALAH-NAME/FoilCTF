interface PrivacyToggleProps {
	id: string;
	label: string;
	checked: boolean;
	isEditing: boolean;
	onChange?: (checked: boolean) => void;
	description?: string;
}

export default function PrivacyToggle({
	id,
	label,
	checked,
	isEditing,
	onChange,
	description,
}: PrivacyToggleProps) {
	const handleToggle = () => {
		if (onChange) {
			onChange(!checked);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			handleToggle();
		}
	};

	return (
		<div className="pb-4 border-b border-dark/10">
			<div className="flex items-center justify-between">
				<div className="flex-1">
					<label htmlFor={id} className="text-sm font-semibold text-dark block">
						{label}
					</label>
					{description && (
						<p className="text-xs text-dark/50 mt-1">{description}</p>
					)}
				</div>
				{isEditing ? (
					<button
						type="button"
						role="switch"
						aria-checked={checked}
						id={id}
						onClick={handleToggle}
						onKeyDown={handleKeyDown}
						className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
							checked ? 'bg-primary' : 'bg-dark/20'
						}`}
						aria-label={label}
					>
						<span className="sr-only">{label}</span>
						<span
							className={`absolute h-4 w-4 transform rounded-full bg-white transition-transform ${
								checked ? 'translate-x-3' : '-translate-x-3'
							}`}
						/>
					</button>
				) : (
					<p className="text-dark/60" id={`${id}-value`}>
						{checked ? 'Private' : 'Public'}
					</p>
				)}
			</div>
		</div>
	);
}
