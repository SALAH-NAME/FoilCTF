import { useState } from 'react';

import type { Route } from './+types/team';

import Modal from '~/components/Modal';
import Button from '~/components/Button';
import InfoText from '~/components/InfoText';
import StatsCard from '~/components/StatsCard';
import FormInput from '~/components/FormInput';
import FilterTabs from '~/components/FilterTabs';
import PageHeader from '~/components/PageHeader';
import TeamMemberCard from '~/components/TeamMemberCard';
import JoinRequestCard from '~/components/JoinRequestCard';


export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - My Team' }];
}

interface TeamMember {
	username: string;
	avatar?: string;
	role: 'captain' | 'member';
	challengesSolved: number;
	totalPoints: number;
}

interface JoinRequest {
	username: string;
	avatar?: string;
	challengesSolved: number;
	totalPoints: number;
	requestedAt: string;
}

// Mock data - Replace
const mockTeamData = {
	team: {
		id: '1',
		name: 'Cyber Warriors',
		description:
			'A dedicated team of security enthusiasts focused on web exploitation and cryptography challenges.',
		memberCount: 4,
		maxMembers: 5,
		isOpen: true,
		totalPoints: 5680,
		eventsParticipated: 12,
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
	},
	joinRequests: [
		{
			username: 'Eve_Hacker',
			challengesSolved: 22,
			totalPoints: 980,
			requestedAt: '2026-02-14',
		},
		{
			username: 'Frank_Sec',
			challengesSolved: 31,
			totalPoints: 1320,
			requestedAt: '2026-02-13',
		},
	] as JoinRequest[],
	userRole: 'captain' as 'captain' | 'member',
	hasTeam: true,
};

export default function Page() {
	const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members');
	const [teamData, setTeamData] = useState(mockTeamData);
	const [showSettings, setShowSettings] = useState(false);
	const [showLeaveModal, setShowLeaveModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [teamDescription, setTeamDescription] = useState(
		teamData.team.description
	);

	// captain | member
	const isCaptain = teamData.userRole === 'captain';
	// View Mode
	const viewMode = 'hasteamMember' as 'hasTeam' | 'hasteamMember' | 'noTeam';

	const handleMakeCaptain = (username: string) => {
		// TODO: Implement
		console.log('Making captain:', username);
		setTeamData((prev) => ({
			...prev,
			team: {
				...prev.team,
				members: prev.team.members.map((member) =>
					member.username === username
						? { ...member, role: 'captain' as const }
						: member.role === 'captain'
							? { ...member, role: 'member' as const }
							: member
				),
			},
		}));
	};

	const handleKickMember = (username: string) => {
		// TODO: Implement
		console.log('Kicking member:', username);
		setTeamData((prev) => ({
			...prev,
			team: {
				...prev.team,
				members: prev.team.members.filter((m) => m.username !== username),
				memberCount: prev.team.memberCount - 1,
			},
		}));
	};

	const handleAcceptRequest = (username: string) => {
		// TODO: Implement
		console.log('Accepting join request:', username);
		const request = teamData.joinRequests.find((r) => r.username === username);
		if (request) {
			setTeamData((prev) => ({
				...prev,
				team: {
					...prev.team,
					members: [
						...prev.team.members,
						{
							...request,
							role: 'member' as const,
						},
					],
					memberCount: prev.team.memberCount + 1,
				},
				joinRequests: prev.joinRequests.filter((r) => r.username !== username),
			}));
		}
	};

	const handleRejectRequest = (username: string) => {
		// TODO: Implement
		console.log('Rejecting join request:', username);
		setTeamData((prev) => ({
			...prev,
			joinRequests: prev.joinRequests.filter((r) => r.username !== username),
		}));
	};

	const handleSaveSettings = () => {
		// TODO: Implement
		console.log('Saving settings:', {
			description: teamDescription,
			isOpen: teamData.team.isOpen,
		});
		setTeamData((prev) => ({
			...prev,
			team: { ...prev.team, description: teamDescription },
		}));
		setShowSettings(false);
	};

	const handleLeaveTeam = () => {
		// TODO: Implement
		console.log('Leaving team');
		setShowLeaveModal(false);
		// Redirect to teams page
	};

	const handleDeleteTeam = () => {
		// TODO: Implement
		console.log('Deleting team');
		setShowDeleteModal(false);
		// Redirect to teams page
	};

	const tabs = isCaptain
		? [
				{
					id: 'members',
					value: 'members',
					label: 'Members',
					count: teamData.team.members.length,
				},
				{
					id: 'requests',
					value: 'requests',
					label: 'Join Requests',
					count: teamData.joinRequests.length,
				},
			]
		: [
				{
					id: 'members',
					value: 'members',
					label: 'Members',
					count: teamData.team.members.length,
				},
			];

	if (viewMode === 'noTeam') {
		return (
			<>
				<PageHeader title="My Team" />

				<main id="main-content" className="max-w-7xl mx-auto px-4 py-8">
					<div className="bg-white/70 rounded-md p-12 border border-dark/10 text-center">
						<h2 className="text-2xl font-bold text-dark mb-4">
							You're not in a team yet
						</h2>
						<p className="text-dark/60 mb-6">
							Browse available teams and request to join one, or create your own
							team to compete in CTF events.
						</p>
						<div className="flex gap-4 justify-center">
							<Button
								onClick={() => (window.location.href = '/teams')}
								variant="primary"
							>
								Browse Teams
							</Button>
							<Button variant="secondary">Create Team</Button>
						</div>
					</div>
				</main>
			</>
		);
	}

	return (
		<>
			<PageHeader
				title={teamData.team.name}
				action={
					<div className="flex gap-3">
						{isCaptain && (
							<Button
								variant="secondary"
								onClick={() => setShowSettings(true)}
								aria-label="Team settings"
							>
								Settings
							</Button>
						)}
						<Button
							variant="danger"
							onClick={() => setShowLeaveModal(true)}
							aria-label="Leave team"
						>
							Leave Team
						</Button>
					</div>
				}
			/>

			<main id="main-content" className="max-w-7xl mx-auto px-4 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-8">
						<section
							aria-labelledby="team-info-heading"
							className="bg-white/70 rounded-md p-6 border border-dark/10"
						>
							<h2 id="team-info-heading" className="sr-only">
								Team Information
							</h2>
							<div className="flex flex-wrap gap-4 items-center justify-between mb-4">
								<div className="flex items-center gap-4">
									<InfoText icon="user" className="text-dark/60">
										{teamData.team.memberCount}/{teamData.team.maxMembers}{' '}
										Members
									</InfoText>
									<div
										className={`px-3 py-1 rounded-full text-sm font-semibold ${
											teamData.team.isOpen
												? 'bg-green-100 text-green-700'
												: 'bg-gray-100 text-gray-700'
										}`}
										aria-label={
											teamData.team.isOpen
												? 'Team is open for new members'
												: 'Team is closed for new members'
										}
									>
										{teamData.team.isOpen ? 'Open' : 'Closed'}
									</div>
								</div>
							</div>
							{teamData.team.description && (
								<p className="text-dark/80">{teamData.team.description}</p>
							)}
						</section>

						{isCaptain && (
							<FilterTabs
								tabs={tabs}
								activeTab={activeTab}
								onChange={(value) =>
									setActiveTab(value as 'members' | 'requests')
								}
							/>
						)}

						{activeTab === 'members' && (
							<section aria-labelledby="members-heading">
								<h2
									id="members-heading"
									className="text-2xl font-bold text-dark mb-4"
								>
									Team Members
								</h2>
								<div
									className="space-y-4"
									role="list"
									aria-label="Team members list"
								>
									{teamData.team.members.map((member) => (
										<div key={member.username} role="listitem">
											<TeamMemberCard
												{...member}
												isCaptain={isCaptain}
												onMakeCaptain={
													isCaptain && member.role !== 'captain'
														? () => handleMakeCaptain(member.username)
														: undefined
												}
												onKick={
													isCaptain && member.role !== 'captain'
														? () => handleKickMember(member.username)
														: undefined
												}
											/>
										</div>
									))}
								</div>
							</section>
						)}

						{isCaptain && activeTab === 'requests' && (
							<section aria-labelledby="requests-heading">
								<h2
									id="requests-heading"
									className="text-2xl font-bold text-dark mb-4"
								>
									Join Requests ({teamData.joinRequests.length})
								</h2>
								{teamData.joinRequests.length === 0 ? (
									<div
										className="bg-white/70 rounded-md p-8 border border-dark/10 text-center"
										role="status"
									>
										<p className="text-dark/60">No pending join requests.</p>
									</div>
								) : (
									<div
										className="space-y-4"
										role="list"
										aria-label="Join requests list"
									>
										{teamData.joinRequests.map((request) => (
											<div key={request.username} role="listitem">
												<JoinRequestCard
													{...request}
													onAccept={() => handleAcceptRequest(request.username)}
													onReject={() => handleRejectRequest(request.username)}
												/>
											</div>
										))}
									</div>
								)}
							</section>
						)}
					</div>

					<aside className="lg:col-span-1" aria-labelledby="stats-heading">
						<h2 id="stats-heading" className="sr-only">
							Team Statistics
						</h2>
						<div className="space-y-4 sticky top-4">
							<StatsCard
								iconName="trophy"
								label="Total Points"
								value={teamData.team.totalPoints.toLocaleString()}
							/>
							<StatsCard
								iconName="calendar"
								label="Events Participated"
								value={teamData.team.eventsParticipated}
							/>
							<StatsCard
								iconName="user"
								label="Team Size"
								value={`${teamData.team.memberCount}/${teamData.team.maxMembers}`}
							/>
						</div>
					</aside>
				</div>
			</main>

			<Modal
				isOpen={showSettings}
				onClose={() => {
					setShowSettings(false);
					setTeamDescription(teamData.team.description);
				}}
				title="Team Settings"
				footer={
					<div className="flex gap-3 justify-end">
						<Button
							variant="ghost"
							onClick={() => {
								setShowSettings(false);
								setTeamDescription(teamData.team.description);
							}}
						>
							Cancel
						</Button>
						<Button variant="primary" onClick={handleSaveSettings}>
							Save Changes
						</Button>
					</div>
				}
			>
				<div className="space-y-6">
					<FormInput
						label="Team Description"
						name="description"
						type="textarea"
						value={teamDescription}
						onChange={(e) => setTeamDescription(e.target.value)}
						placeholder="Describe your team..."
						rows={4}
					/>

					<div className="pb-4 border-b border-dark/10">
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<label className="text-sm font-semibold text-dark block">
									Open for new members to join
								</label>
								<p className="text-xs text-dark/50 mt-1">
									When open, users can request to join your team
								</p>
							</div>
							<button
								type="button"
								role="switch"
								aria-checked={teamData.team.isOpen}
								onClick={() =>
									setTeamData((prev) => ({
										...prev,
										team: { ...prev.team, isOpen: !prev.team.isOpen },
									}))
								}
								onKeyDown={(e) => {
									if (e.key === ' ' || e.key === 'Enter') {
										e.preventDefault();
										setTeamData((prev) => ({
											...prev,
											team: { ...prev.team, isOpen: !prev.team.isOpen },
										}));
									}
								}}
								className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
									teamData.team.isOpen ? 'bg-primary' : 'bg-dark/20'
								}`}
								aria-label="Toggle team openness"
							>
								<span className="sr-only">Open for new members to join</span>
								<span
									className={`absolute h-4 w-4 transform rounded-full bg-white transition-transform ${
										teamData.team.isOpen ? 'translate-x-3' : '-translate-x-3'
									}`}
								/>
							</button>
						</div>
					</div>

					<div className="pt-4 border-t border-dark/10">
						<h3 className="text-lg font-semibold text-dark mb-3">
							Danger Zone
						</h3>
						<Button
							variant="danger"
							onClick={() => {
								setShowSettings(false);
								setShowDeleteModal(true);
							}}
							className="w-full"
						>
							Delete Team
						</Button>
						<p className="text-sm text-dark/60 mt-2">
							This action cannot be undone. All members will be removed.
						</p>
					</div>
				</div>
			</Modal>

			<Modal
				isOpen={showLeaveModal}
				onClose={() => setShowLeaveModal(false)}
				title="Leave Team"
				size="sm"
				footer={
					<div className="flex gap-3 justify-end">
						<Button variant="ghost" onClick={() => setShowLeaveModal(false)}>
							Cancel
						</Button>
						{!isCaptain && (
							<Button variant="danger" onClick={handleLeaveTeam}>
								Leave Team
							</Button>
						)}
					</div>
				}
			>
				{isCaptain ? (
					<div className="space-y-4">
						<p className="text-dark/80">
							You are the team captain. Before leaving, you must transfer the
							captain role to another member.
						</p>
						<p className="text-dark/80">
							Go to the Members tab and select "Make Captain" for the member you
							want to transfer leadership to.
						</p>
					</div>
				) : (
					<p className="text-dark/80">
						Are you sure you want to leave{' '}
						<span className="font-semibold">{teamData.team.name}</span>?
					</p>
				)}
			</Modal>

			<Modal
				isOpen={showDeleteModal}
				onClose={() => setShowDeleteModal(false)}
				title="Delete Team"
				size="sm"
				footer={
					<div className="flex gap-3 justify-end">
						<Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
							Cancel
						</Button>
						<Button variant="danger" onClick={handleDeleteTeam}>
							Delete Team
						</Button>
					</div>
				}
			>
				<div className="space-y-4">
					<p className="text-dark/80">
						Are you sure you want to delete{' '}
						<span className="font-semibold">{teamData.team.name}</span>?
					</p>
					<p className="text-dark/80 font-semibold">
						This action cannot be undone. All members will be removed from the
						team.
					</p>
				</div>
			</Modal>
		</>
	);
}
