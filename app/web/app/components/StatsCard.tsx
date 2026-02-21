import Icon, { type IconName } from './Icon';

interface StatsCardProps {
	value: number | string;
	label: string;
	iconName?: IconName;
}

export default function StatsCard({ value, label, iconName }: StatsCardProps) {
	return (
		<div className="bg-white rounded-md p-6 border border-dark/10 text-center">
			{iconName && (
				<div className="flex justify-center mb-3">
					<Icon
						name={iconName}
						className="w-8 h-8 text-primary"
						aria-hidden={true}
					/>
				</div>
			)}
			<p className="text-4xl font-bold text-primary mb-2">{value}</p>
			<p className="text-dark/60 font-medium">{label}</p>
		</div>
	);
}
