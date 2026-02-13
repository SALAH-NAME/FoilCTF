type EventStatus = 'upcoming' | 'active' | 'ended';

interface StatusBadgeProps {
	status: EventStatus;
	variant?: 'solid' | 'outline' | 'white';
}

export default function StatusBadge({
	status,
	variant = 'solid',
}: StatusBadgeProps) {
	const solidStyles = {
		upcoming: 'bg-amber-500 text-white',
		active: 'bg-green-600 text-white',
		ended: 'bg-gray-400 text-white',
	};

	const outlineStyles = {
		upcoming: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
		active: 'bg-green-500/10 text-green-500 border-green-500/20',
		ended: 'bg-muted/10 text-muted border-muted/20',
	};

	const whiteStyles = {
		upcoming: 'bg-white text-amber-500 border-amber-500',
		active: 'bg-white text-green-600 border-green-600',
		ended: 'bg-white text-gray-500 border-gray-400',
	};

	const labels = {
		upcoming: 'Upcoming',
		active: 'Active',
		ended: 'Ended',
	};

	const styleClass =
		variant === 'solid'
			? solidStyles[status]
			: variant === 'outline'
				? outlineStyles[status]
				: whiteStyles[status];

	return (
		<span
			role="status"
			aria-label={`Event status: ${labels[status]}`}
			className={`${styleClass} text-xs font-semibold px-4 py-2 w-fit rounded-full uppercase tracking-wide border ${variant === 'outline' ? 'border' : ''}`}
		>
			{labels[status]}
		</span>
	);
}
