import { useState, useEffect } from 'react';

interface CountdownProps {
	targetDate: string;
}

interface TimeLeft {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
}

export default function Countdown({ targetDate }: CountdownProps) {
	const calculateTimeLeft = (): TimeLeft | null => {
		const difference = +new Date(targetDate) - +new Date();

		if (difference > 0) {
			return {
				days: Math.floor(difference / (1000 * 60 * 60 * 24)),
				hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
				minutes: Math.floor((difference / 1000 / 60) % 60),
				seconds: Math.floor((difference / 1000) % 60),
			};
		}

		return null;
	};

	const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(
		calculateTimeLeft()
	);

	useEffect(() => {
		const timer = setInterval(() => {
			setTimeLeft(calculateTimeLeft());
		}, 1000);

		return () => clearInterval(timer);
	}, [targetDate]);

	if (!timeLeft) {
		return <p className="text-dark/60 font-medium">Event has started!</p>;
	}

	return (
		<div className="flex gap-1 md:gap-4">
			{Object.entries(timeLeft).map(([unit, value]) => (
				<div key={unit} className="flex flex-col items-center">
					<div className="bg-primary text-white font-bold text-xl md:text-2xl lg:text-3xl px-2 py-2 md:px-4 md:py-3 rounded-md min-w-[50px] md:min-w-[70px] text-center">
						{value.toString().padStart(2, '0')}
					</div>
					<span className="text-xs md:text-sm text-dark/60 mt-1 md:mt-2 capitalize">
						{unit}
					</span>
				</div>
			))}
		</div>
	);
}
