import { Link } from 'react-router';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import BackLink from '~/components/BackLink';
import PageSection from '~/components/PageSection';
import InfoText from '~/components/InfoText';

interface RouteParams {
	params: {
		id: string;
	};
}

export function meta({ params }: RouteParams) {
	return [
		{ title: `Leaderboard - Event ${params.id} - FoilCTF` },
		{ name: 'description', content: `Event leaderboard for ${params.id}` },
	];
}

export default function EventLeaderboard({ params }: RouteParams) {
	// Mock leaderboard data
	const leaderboard = [
		{
			rank: 1,
			team: 'Elite Hackers',
			score: 2500,
			solves: 25,
			lastSolve: '15 mins ago',
		},
		{
			rank: 2,
			team: 'Cyber Warriors',
			score: 2100,
			solves: 21,
			lastSolve: '1 hour ago',
		},
		{
			rank: 3,
			team: 'Binary Ninjas',
			score: 1950,
			solves: 20,
			lastSolve: '3 hours ago',
		},
		{
			rank: 4,
			team: 'Code Breakers',
			score: 1800,
			solves: 18,
			lastSolve: '8 hours ago',
		},
		{
			rank: 5,
			team: 'Security Squad',
			score: 1650,
			solves: 17,
			lastSolve: '1 day ago',
		},
		{
			rank: 6,
			team: 'Pwn Masters',
			score: 1500,
			solves: 15,
			lastSolve: '2 days ago',
		},
		{
			rank: 7,
			team: 'Hash Crackers',
			score: 1350,
			solves: 14,
			lastSolve: '3 days ago',
		},
		{
			rank: 8,
			team: 'Root Access',
			score: 1200,
			solves: 12,
			lastSolve: '4 days ago',
		},
		{
			rank: 9,
			team: 'Exploit Experts',
			score: 1050,
			solves: 11,
			lastSolve: '5 days ago',
		},
		{
			rank: 10,
			team: 'Crypto Kings',
			score: 900,
			solves: 9,
			lastSolve: '6 days ago',
		},
	];

	return (
		<div className="flex flex-col gap-6">
			<BackLink to={`/events/${params.id}`}>Back to Event</BackLink>

			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div className='ml-4'>
					<h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
						Leaderboard
					</h1>
					<p className="text-muted">Live rankings for Event {params.id}</p>
				</div>
				<InfoText icon="user" className="text-sm text-muted">
					{leaderboard.length} teams competing
				</InfoText>
			</div>

			<div className="bg-surface border border-border rounded-lg overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-dark/5 border-b border-border">
							<tr>
								<th className="text-center py-3 px-2 md:py-4 md:px-6 text-xs md:text-sm font-semibold text-foreground">
									Rank
								</th>
								<th className="text-center py-3 px-2 md:py-4 md:px-6 text-xs md:text-sm font-semibold text-foreground border-l border-border">
									Team
								</th>
								<th className="text-center py-3 px-2 md:py-4 md:px-6 text-xs md:text-sm font-semibold text-foreground border-l border-border">
									Score
								</th>
								<th className="text-center py-3 px-2 md:py-4 md:px-6 text-xs md:text-sm font-semibold text-foreground border-l border-border">
									Solves
								</th>
								<th className="text-center py-3 px-2 md:py-4 md:px-6 text-xs md:text-sm font-semibold text-foreground border-l border-border">
									Last Solve
								</th>
							</tr>
						</thead>
						<tbody>
							{leaderboard.map((entry) => (
								<tr
									key={entry.rank}
									className="border-b border-border last:border-0 hover:bg-dark/5 transition-colors"
								>
									<td className="py-3 px-2 md:py-4 md:px-6">
										<div className="flex items-center justify-center gap-2">
											{entry.rank <= 3 ? (
												<span className="text-xl md:text-2xl">
													{entry.rank === 1
														? '🥇'
														: entry.rank === 2
															? '🥈'
															: '🥉'}
												</span>
											) : (
												<span className="text-base md:text-lg font-semibold text-muted">
													{entry.rank}
												</span>
											)}
										</div>
									</td>
									<td className="py-3 px-2 md:py-4 md:px-6 text-center border-l border-border">
										<span className="font-semibold text-foreground text-sm md:text-base">
											{entry.team}
										</span>
									</td>
									<td className="py-3 px-2 md:py-4 md:px-6 text-center border-l border-border">
										<span className="font-bold text-primary text-base md:text-lg">
											{entry.score.toLocaleString()}
										</span>
									</td>
									<td className="py-3 px-2 md:py-4 md:px-6 text-center border-l border-border">
										<span className="text-muted text-sm md:text-base">
											{entry.solves}
										</span>
									</td>
									<td className="py-3 px-2 md:py-4 md:px-6 text-center border-l border-border">
										<span className="text-xs md:text-sm text-muted">
											{entry.lastSolve}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<PageSection className="bg-primary/5 border-primary/20">
				<h3 className="font-semibold text-foreground mb-2">
					How Rankings Work
				</h3>
				<ul className="space-y-1 text-sm text-muted">
					<li>• Teams are ranked by total score</li>
					<li>• Each challenge has a point value</li>
					<li>• Faster solves may earn bonus points</li>
				</ul>
			</PageSection>
		</div>
	);
}
