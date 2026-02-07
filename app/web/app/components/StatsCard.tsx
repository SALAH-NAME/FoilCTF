interface StatsCardProps {
	value: number | string;
	label: string;
}

export default function StatsCard({ value, label }: StatsCardProps) {
	return (
		<div className="bg-white rounded-md p-6 border border-dark/10 text-center">
			<p className="text-4xl font-bold text-primary mb-2">{value}</p>
			<p className="text-dark/60 font-medium">{label}</p>
		</div>
	);
}
