import { Link } from 'react-router';
import Icon from './Icon';
import StatusBadge from './StatusBadge';
import InfoText from './InfoText';

type EventStatus = 'upcoming' | 'active' | 'ended';

interface EventCardProps {
	id: string;
	name: string;
	status: EventStatus;
	startDate: string;
	endDate: string;
	teamsCount: number;
	maxTeams: number;
	organizer: string;
}

export default function EventCard({
	id,
	name,
	status,
	startDate,
	endDate,
	teamsCount,
	maxTeams,
	organizer,
}: EventCardProps) {
	const slug = id;

	return (
		<article>
			<Link
				to={`/events/${slug}`}
				aria-label={`View details for ${name} event`}
				className="h-full group bg-white/70 rounded-md p-6 border border-dark/10 hover:border-primary transition-all duration-200 hover:shadow-lg no-underline block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
			>
				<div className="flex flex-wrap gap-4 items-start justify-between mb-4">
					<h3 className="text-xl font-bold text-dark group-hover:text-primary transition-colors flex-1">
						{name}
					</h3>
					<StatusBadge status={status} variant="solid" />
				</div>

				<InfoText icon="user" className="text-sm text-dark/60 mb-4">
					by {organizer}
				</InfoText>

				<div className="space-y-2 mb-4 text-sm text-dark/80">
					<InfoText icon="calendar" iconClassName="size-4 text-primary">
						{new Date(startDate).toLocaleDateString('en-US', {
							month: 'short',
							day: 'numeric',
							year: 'numeric',
						})}
					</InfoText>
					<InfoText icon="calendar" iconClassName="size-4 text-primary">
						{new Date(endDate).toLocaleDateString('en-US', {
							month: 'short',
							day: 'numeric',
							year: 'numeric',
						})}
					</InfoText>
				</div>

				<div className="flex flex-wrap gap-4 items-center justify-between pt-4 border-t border-dark/10">
					<InfoText icon="user" className="text-sm text-dark/60">
						<span className="font-semibold">
							{teamsCount}/{maxTeams}
						</span>{' '}
						<span>Teams</span>
					</InfoText>
					{(status === 'active' || status === 'ended') && (
						<Link
							to={`/events/${slug}/leaderboard`}
							onClick={(e) => e.stopPropagation()}
							aria-label={`View leaderboard for ${name}`}
							className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:rounded"
						>
							<Icon name="trophy" className="size-4" aria-hidden={true} />
							<span>Leaderboard</span>
						</Link>
					)}
				</div>
			</Link>
		</article>
	);
}
