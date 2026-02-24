import { useState } from 'react';
import { useParams, Link } from 'react-router';
import PageHeader from '~/components/PageHeader';
import Button from '~/components/Button';
import InfoText from '~/components/InfoText';
import StatsCard from '~/components/StatsCard';
import TeamMemberCard from '~/components/TeamMemberCard';
import type { Route } from './+types/teams.$id';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Team Details' }];
}

interface TeamMember {
	username: string;
	avatar?: string;
	role: 'captain' | 'member';
	challengesSolved: number;
	totalPoints: number;
}

// Mock data - Replace
const mockTeam = {
	id: '1',
	name: 'Cyber Warriors',
	memberCount: 4,
	maxMembers: 5,
	captainName: 'Alice_CTF',
	eventsParticipated: 12,
	totalPoints: 5680,
	isOpen: true,
	description:
		'A dedicated team of security enthusiasts focused on web exploitation and cryptography challenges. We compete in international CTFs and constantly improve our skills.',
	createdAt: '2025-06-15',
	members: [
		{
			username: 'Alice_CTF',
			role: 'captain' as const,
			challengesSolved: 45,
			totalPoints: 2100,
		},
		{
			username: 'Bob_Sec',
			role: 'member' as const,
			challengesSolved: 38,
			totalPoints: 1680,
		},
		{
			username: 'Charlie_Pwn',
			role: 'member' as const,
			challengesSolved: 32,
			totalPoints: 1450,
		},
		{
			username: 'Diana_Rev',
			role: 'member' as const,
			challengesSolved: 28,
			totalPoints: 1100,
		},
	] as TeamMember[],
};

export default function Page() {
	const { id } = useParams();
	const [hasRequested, setHasRequested] = useState(false);
	const team = mockTeam;

	const canRequestJoin = team.isOpen && !hasRequested;

	const handleRequestJoin = () => {
		// TODO: Implement
		setHasRequested(true);
		console.log('Request to join team:', id);
	};

	return (
		<>
			<PageHeader
				title={team.name}
				action={
					<Button
						onClick={handleRequestJoin}
						disabled={!canRequestJoin}
						variant={hasRequested ? 'ghost' : 'primary'}
						aria-label={
							hasRequested
								? 'Join request pending'
								: !team.isOpen
									? 'Team is closed for new members'
									: `Request to join ${team.name}`
						}
					>
						{hasRequested
							? 'Request Pending'
							: !team.isOpen
								? 'Closed'
								: 'Request to Join'}
					</Button>
				}
			/>

			<main id="main-content" className="max-w-7xl mx-auto px-4 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-8">
						<section aria-labelledby="team-info-heading">
							<div className="bg-white/70 rounded-md p-6 border border-dark/10">
								<h2
									id="team-info-heading"
									className="text-2xl font-bold text-dark mb-4"
								>
									About
								</h2>
								<p className="text-dark/80 mb-4">{team.description}</p>
								<div className="flex flex-wrap gap-4 text-sm">
									<InfoText icon="calendar" className="text-dark/60">
										Created{' '}
										{new Date(team.createdAt).toLocaleDateString('en-US', {
											month: 'long',
											year: 'numeric',
										})}
									</InfoText>
									<InfoText icon="user" className="text-dark/60">
										Captain: {team.captainName}
									</InfoText>
									<div
										className={`px-3 py-1 rounded-full text-sm font-semibold ${
											team.isOpen
												? 'bg-green-100 text-green-700'
												: 'bg-gray-100 text-gray-700'
										}`}
										aria-label={
											team.isOpen
												? 'Team is open for new members'
												: 'Team is closed for new members'
										}
									>
										{team.isOpen ? 'Open' : 'Closed'}
									</div>
								</div>
							</div>
						</section>

						<section aria-labelledby="members-heading">
							<h2
								id="members-heading"
								className="text-2xl font-bold text-dark mb-4"
							>
								Members ({team.members.length}/{team.maxMembers})
							</h2>
							<div
								className="space-y-4"
								role="list"
								aria-label="Team members list"
							>
								{team.members.map((member) => (
									<div key={member.username} role="listitem">
										<TeamMemberCard {...member} isCaptain={false} />
									</div>
								))}
							</div>
						</section>
					</div>

					<aside className="lg:col-span-1" aria-labelledby="stats-heading">
						<h2 id="stats-heading" className="sr-only">
							Team Statistics
						</h2>
						<div className="space-y-4 sticky top-4">
							<StatsCard
								label="Total Points"
								value={team.totalPoints.toLocaleString()}
							/>
							<StatsCard
								label="Events Participated"
								value={team.eventsParticipated}
							/>
							<StatsCard
								label="Team Size"
								value={`${team.memberCount}/${team.maxMembers}`}
							/>
						</div>
					</aside>
				</div>
			</main>
		</>
	);
}
