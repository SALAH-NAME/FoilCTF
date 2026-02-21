import Countdown from './Countdown';

type CountdownVariant = 'upcoming' | 'active';

interface CountdownCardProps {
	variant: CountdownVariant;
	targetDate: string;
	title?: string;
}

export default function CountdownCard({
	variant,
	targetDate,
	title,
}: CountdownCardProps) {
	const variantStyles = {
		upcoming: 'from-primary/10 to-primary/5 border-primary/20',
		active: 'from-green-500/10 to-green-500/5 border-green-500/20',
	};

	const defaultTitles = {
		upcoming: 'Event Starts In',
		active: 'Event Ends In',
	};

	return (
		<div
			className={`col-span-full bg-linear-to-r ${variantStyles[variant]} border rounded-md p-4 md:p-6`}
		>
			<div className="flex flex-col items-center gap-3 md:gap-4">
				<h2 className="text-lg md:text-xl font-semibold text-foreground">
					{title || defaultTitles[variant]}
				</h2>
				<Countdown targetDate={targetDate} />
			</div>
		</div>
	);
}
