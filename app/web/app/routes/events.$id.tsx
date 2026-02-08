import { useState } from 'react';
import { Link } from 'react-router';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import StatusBadge from '~/components/StatusBadge';
import EventStatCard from '~/components/EventStatCard';
import BackLink from '~/components/BackLink';
import PageSection from '~/components/PageSection';
import CountdownCard from '~/components/CountdownCard';
import InfoText from '~/components/InfoText';

interface RouteParams {
	params: {
		id: string;
	};
}

export function meta({ params }: RouteParams) {
	return [
		{ title: `Event ${params.id} - FoilCTF` },
		{ name: 'description', content: `Details for event ${params.id}` },
	];
}

export default function EventDetail({ params }: RouteParams) {
	const [isRegistered, setIsRegistered] = useState(false);

	// Mock event data
	const event = {
		id: params.id,
		name: 'Winter Cyber Challenge 2026',
		status: 'active' as 'upcoming' | 'active' | 'ended',
		startDate: '2026-02-01T00:00:00Z',
		endDate: '2026-02-15T23:59:59Z',
		organizer: 'CyberSec Team',
		teams: 145,
		maxTeams: 200,
		description:
			"Welcome to the Winter Cyber Challenge 2026! <br /> This two-week competition features exciting challenges across various categories including web exploitation, reverse engineering, cryptography, and forensics. Whether you're a beginner or an experienced hacker, there's something for everyone. Join teams from around the world and test your skills against the best.",
		registrationOpen: true,
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4">
				<BackLink to="/events">Back to Events</BackLink>

				<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
					<div className="flex flex-col gap-2">
						<div className="flex flex-col sm:flex-row sm:items-center gap-3">
							<h1 className="text-2xl md:text-3xl font-bold text-foreground">
								{event.name}
							</h1>
							<StatusBadge status={event.status} variant="outline" />
						</div>
						<InfoText icon="user" className="text-muted">
							Organized by {event.organizer}
						</InfoText>
					</div>

					{event.registrationOpen && event.status !== 'ended' && (
						<div className="flex gap-2">
							{isRegistered ? (
								<Button variant="danger" onClick={() => setIsRegistered(false)}>
									Unregister
								</Button>
							) : (
								<Button variant="primary" onClick={() => setIsRegistered(true)}>
									Register Now
								</Button>
							)}
						</div>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{event.status === 'upcoming' && (
					<CountdownCard variant="upcoming" targetDate={event.startDate} />
				)}

				{event.status === 'active' && (
					<CountdownCard variant="active" targetDate={event.endDate} />
				)}

				<EventStatCard
					icon="calendar"
					label="Start Date"
					value={new Date(event.startDate).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric',
						year: 'numeric',
					})}
				/>

				<EventStatCard
					icon="calendar"
					label="End Date"
					value={new Date(event.endDate).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric',
						year: 'numeric',
					})}
				/>

				<EventStatCard
					icon="user"
					label="Teams"
					value={`${event.teams} / ${event.maxTeams}`}
				/>

				<EventStatCard
					icon="chart"
					label="Registration"
					value={event.registrationOpen ? 'Open' : 'Closed'}
				/>
			</div>

			<PageSection>
				<h2 className="text-lg md:text-xl font-semibold text-foreground mb-4">
					About This Event
				</h2>
				<p className="text-muted leading-relaxed whitespace-pre-line">
					{event.description}
				</p>
			</PageSection>

			{event.status !== 'upcoming' && (
				<PageSection>
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<h2 className="text-lg md:text-xl font-semibold text-foreground mb-2">
								Leaderboard
							</h2>
							<p className="text-muted">
								View rankings and scores for all participating teams
							</p>
						</div>
						<Link to={`/events/${params.id}/leaderboard`}>
							<Button variant="primary">
								View Leaderboard
								<Icon name="chevronRight" className="w-4 h-4" />
							</Button>
						</Link>
					</div>
				</PageSection>
			)}
		</div>
	);
}
