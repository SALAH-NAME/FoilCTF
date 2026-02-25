import { Link } from 'react-router';

import Button from './Button';
import InfoText from './InfoText';

interface TeamCardProps {
	id: number;
	name: string;
	members_count: number;
	captain_name: string;
	is_locked: boolean | null;
	total_points?: number;
	events_participated?: number;
	can_request?: boolean;
	has_requested?: boolean;
	onRequestJoin?: () => void;
	onCancelRequest?: () => void;
}

export default function TeamCard({
	name,
	members_count,
	captain_name,
	is_locked,
	total_points = 0,
	events_participated = 0,
	has_requested = false,
	can_request = false,
	onRequestJoin,
	onCancelRequest,
}: TeamCardProps) {
	const handleButtonClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (has_requested && onCancelRequest) {
			onCancelRequest();
		} else if (onRequestJoin) {
			onRequestJoin();
		}
	};

	return (
		<article className="h-full">
			<Link
				to={`/teams/${name}`}
				className="flex flex-col bg-white/70 rounded-md justify-between h-full p-6 border border-dark/10 hover:border-primary transition-all duration-200 hover:shadow-lg no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
				aria-label={`View ${name} team details`}
			>
				<div className="flex  gap-4 items-start justify-between mb-4">
					<h3 className="text-xl font-bold text-dark group-hover:text-primary transition-colors shrink break-all line-clamp-1">
						{name}
					</h3>
					<div
						className={`px-3 py-1 rounded-full text-sm font-semibold ${
							!is_locked
								? 'bg-green-100 text-green-700'
								: 'bg-gray-100 text-gray-700'
						}`}
						aria-label={
							!is_locked ? 'Team is open for joining' : 'Team is closed'
						}
					>
						{!is_locked ? 'Open' : 'Closed'}
					</div>
				</div>

				<InfoText icon="user" className="text-sm text-dark/60 mb-auto">
					Captain: {captain_name}
				</InfoText>

				<div className="grid grid-cols-2 gap-4 my-4">
					<div>
						<InfoText icon="user" className="text-sm text-dark/80">
							<span className="font-semibold">
								{members_count}
							</span>{' '}
							Members
						</InfoText>
					</div>
					<div>
						<InfoText icon="calendar" className="text-sm text-dark/80">
							<span className="font-semibold">{events_participated}</span>{' '}
							Events
						</InfoText>
					</div>
				</div>

				<div className="flex items-center justify-between pt-4 border-t border-dark/10">
					<InfoText icon="trophy" className="text-sm text-dark/60">
						<span className="font-semibold text-primary">{total_points}</span>{' '}
						Points
					</InfoText>
					{(onRequestJoin || onCancelRequest) && can_request && (
						<Button
							size="sm"
							className="h-10"
							onClick={handleButtonClick}
							disabled={(is_locked ?? false) && !has_requested}
							variant={has_requested ? 'secondary' : 'primary'}
							aria-label={
								has_requested
									? 'Cancel join request'
									: is_locked
										? 'Team is closed'
										: `Request to join ${name}`
							}
						>
							{has_requested ? 'Cancel Request' : 'Request to Join'}
						</Button>
					)}
				</div>
			</Link>
		</article>
	);
}
