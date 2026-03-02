import { useState, useEffect } from 'react';
import type { EventStatus } from './EventCard';
import { useQueryClient } from '@tanstack/react-query';

interface CountdownProps {
	targetDate: string;
	status?: EventStatus,
	className?: string;
}

interface TimeLeft {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
}

export default function Countdown({
	status,
	targetDate,
	className = '',
}: CountdownProps) {
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

	const [invalidateQuery, setInvalidateQuery] = useState(false);
	const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

	const queryClient = useQueryClient();
	useEffect(() => {
		setTimeLeft(calculateTimeLeft())
		const timer = setInterval(() => {
			const time_left = calculateTimeLeft();
			if (time_left === null)
				setInvalidateQuery(true);
			setTimeLeft(time_left);
		}, 1000);

		return () => clearInterval(timer);
	}, [targetDate]);

	useEffect(() => {
		if (!invalidateQuery)
			return ;

		const timeout = setTimeout(() => queryClient.invalidateQueries({ queryKey: ['event'] }), 5_000);
		return (() => clearTimeout(timeout));
	}, [invalidateQuery]);

	if (!timeLeft) {
		return (
			<p className="text-dark/60 font-medium sr-only" role="status" aria-live="polite">
				Event {status === 'published' ? 'has started' : 'is done'}!
			</p>
		);
	}

	return (
		<div
			className={`flex gap-2 md:gap-4 ${className}`}
			role="timer"
			aria-live="off"
		>
			{Object.entries(timeLeft).map(([unit, value]) => (
				<div key={unit} className="flex flex-col items-center">
					<div
						aria-label={`${value} ${unit}`}
						className="bg-primary text-white font-bold text-sm md:text-xl lg:text-2xl px-1 py-1 lg:px-2 lg:py-2 rounded-md w-12 lg:w-16 text-center"
					>
						{value.toString().padStart(2, '0')}
					</div>
					<span
						className="text-xs md:text-sm text-dark/60 mt-1 md:mt-2 capitalize"
						aria-hidden="true"
					>
						{unit}
					</span>
				</div>
			))}
		</div>
	);
}
