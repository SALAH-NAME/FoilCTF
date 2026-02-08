import Icon from './Icon';

type IconName = 'calendar' | 'user' | 'challenge' | 'chart';

interface EventStatCardProps {
	icon: IconName;
	label: string;
	value: string | number;
}

export default function EventStatCard({
	icon,
	label,
	value,
}: EventStatCardProps) {
	return (
		<div className="bg-surface border border-border rounded-lg p-4 md:p-6">
			<div className="flex items-center gap-3 mb-2">
				<Icon name={icon} className="w-5 h-5 text-primary" />
				<h3 className="text-sm font-medium text-muted">{label}</h3>
			</div>
			<p className="text-xl md:text-2xl font-bold text-foreground">{value}</p>
		</div>
	);
}
