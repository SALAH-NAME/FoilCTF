type Difficulty = 'easy' | 'medium' | 'hard';

interface ChallengeCardProps {
	name: string;
	points: number;
	solved: boolean;
	solves: number;
	difficulty: Difficulty;
	firstBloodAvailable?: boolean;
	onClick: () => void;
	className?: string;
}

export default function ChallengeCard({
	name,
	points,
	solved,
	solves,
	difficulty,
	firstBloodAvailable,
	onClick,
	className = '',
}: ChallengeCardProps) {
	const difficultyColors = {
		easy: 'bg-green-500',
		medium: 'bg-amber-500',
		hard: 'bg-red-500',
	};

	return (
		<button
			onClick={onClick}
			className={`relative flex flex-col items-center w-full h-20 p-4 rounded-md border-2 transition-all ${
				solved
					? 'bg-green-50 border-green-500 hover:bg-green-100'
					: 'bg-white border-neutral-300 hover:border-primary hover:shadow-md'
			} focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
			 ${className}
			 `}
			aria-label={`Challenge: ${name}, ${points} points${solved ? ', Solved' : ''}${firstBloodAvailable ? ', First blood available' : ''}`}
		>
			<h3 className="font-semibold text-dark flex-1 line-clamp-1 break-all">
				{name}
			</h3>

			<div className="flex flex-warp items-center gap-2 text-sm">
				<div
					className={`w-2 h-2 rounded-full ${difficultyColors[difficulty]}`}
					aria-hidden="true"
				/>

				<span
					className="font-semibold text-primary"
					aria-label={`${points} points`}
				>
					{points} pts
				</span>
			</div>
		</button>
	);
}
