import Button from './Button';
import Icon from './Icon';

interface Hint {
	id: number;
	content: string;
	penalty: number;
	purchased: boolean;
}

interface HintCardProps {
	hint: Hint;
	index: number;
	onBuyHint: (hintId: number) => void;
}

export default function HintCard({ hint, index, onBuyHint }: HintCardProps) {
	if (hint.purchased) {
		return (
			<div
				className="bg-green-50 border border-green-200 rounded-md p-4"
				role="article"
				aria-label={`Hint ${index + 1}, purchased`}
			>
				<div className="flex items-start gap-3">
					<div className="flex-1">
						<div className="flex items-center justify-between mb-2">
							<h4 className="font-semibold text-green-900">Hint {index + 1}</h4>
							<span
								className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded"
								aria-label={`Penalty: ${hint.penalty} points`}
							>
								-{hint.penalty} pts
							</span>
						</div>
						<p className="text-sm text-green-800">{hint.content}</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className="bg-neutral-50 border border-neutral-300 rounded-md p-4"
			role="article"
			aria-label={`Hint ${index + 1}, available for purchase`}
		>
			<div className="flex items-center justify-between gap-3">
				<div className="flex-1">
					<div className="flex items-center gap-2">
						<h4 className="font-semibold text-dark">Hint {index + 1}</h4>
					</div>
					<p className="text-sm text-muted">
						Unlock this hint for a point penalty
					</p>
				</div>
				<Button
					variant="secondary"
					size="sm"
					className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-md text-sm font-semibold shrink-0"
					onClick={() => onBuyHint(hint.id)}
					aria-label={`Buy hint ${index + 1} for ${hint.penalty} points penalty`}
				>
					<Icon
						name="yen"
						className={`size-5 text-primary`}
						aria-hidden={true}
					/>
					-{hint.penalty} pts
				</Button>
			</div>
		</div>
	);
}
