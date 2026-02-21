interface PlayStatusCardProps {
	label: string;
	value: string | number;
	className?: string;
	ariaLabel?: string;
}

export default function PlayStatusCard({
	label,
	value,
	className = '',
	ariaLabel,
}: PlayStatusCardProps) {
	return (
		<div
			className={`bg-white border border-neutral-300 rounded-md p-4 ${className}`}
			role="group"
			aria-label={ariaLabel || `${label}: ${value}`}
		>
			<div className="text-sm text-muted mb-1">{label}</div>
			<div className="text-xl font-bold text-dark line-clamp-1 break-all">
				{value}
			</div>
		</div>
	);
}
