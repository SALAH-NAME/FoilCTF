import { Link } from 'react-router';
import InfoText from './InfoText';
import Button from './Button';

interface TeamCardProps {
	id: string;
	name: string;
	memberCount: number;
	maxMembers: number;
	captainName: string;
	eventsParticipated: number;
	totalPoints: number;
	isOpen: boolean;
	isFull: boolean;
	hasRequested?: boolean;
	onRequestJoin?: () => void;
	onCancelRequest?: () => void;
}

export default function TeamCard({
	id,
	name,
	memberCount,
	maxMembers,
	captainName,
	eventsParticipated,
	totalPoints,
	isOpen,
	isFull,
	hasRequested = false,
	onRequestJoin,
	onCancelRequest,
}: TeamCardProps) {
	const handleButtonClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (hasRequested && onCancelRequest) {
			onCancelRequest();
		} else if (onRequestJoin) {
			onRequestJoin();
		}
	};

	return (
		<article className="h-full">
			<Link
				to={`/teams/${id}`}
				className="flex flex-col bg-white/70 rounded-md justify-between h-full p-6 border border-dark/10 hover:border-primary transition-all duration-200 hover:shadow-lg no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
				aria-label={`View ${name} team details`}
			>
				<div className="flex  gap-4 items-start justify-between mb-4">
					<h3 className="text-xl font-bold text-dark group-hover:text-primary transition-colors shrink break-all line-clamp-1">
						{name}
					</h3>
					<div
						className={`px-3 py-1 rounded-full text-sm font-semibold ${
							isOpen
								? 'bg-green-100 text-green-700'
								: 'bg-gray-100 text-gray-700'
						}`}
						aria-label={isOpen ? 'Team is open for joining' : 'Team is closed'}
					>
						{isOpen ? 'Open' : 'Closed'}
					</div>
				</div>

				<InfoText icon="user" className="text-sm text-dark/60 mb-auto">
					Captain: {captainName}
				</InfoText>

				<div className="grid grid-cols-2 gap-4 my-4">
					<div>
						<InfoText icon="user" className="text-sm text-dark/80">
							<span className="font-semibold">
								{memberCount}/{maxMembers}
							</span>{' '}
							Members
						</InfoText>
					</div>
					<div>
						<InfoText icon="calendar" className="text-sm text-dark/80">
							<span className="font-semibold">{eventsParticipated}</span> Events
						</InfoText>
					</div>
				</div>

				<div className="flex items-center justify-between pt-4 border-t border-dark/10">
					<InfoText icon="trophy" className="text-sm text-dark/60">
						<span className="font-semibold text-primary">{totalPoints}</span>{' '}
						Points
					</InfoText>
					{(onRequestJoin || onCancelRequest) && (
						<Button
							size="sm"
							className="h-10"
							onClick={handleButtonClick}
							disabled={(!isOpen || isFull) && !hasRequested}
							variant={hasRequested ? 'secondary' : 'primary'}
							aria-label={
								hasRequested
									? 'Cancel join request'
									: isFull
										? 'Team is full'
										: !isOpen
											? 'Team is closed'
											: `Request to join ${name}`
							}
						>
							{hasRequested ? 'Cancel Request' : 'Request to Join'}
						</Button>
					)}
				</div>
			</Link>
		</article>
	);
}
