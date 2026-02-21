import { useState } from 'react';
import { useSearchParams } from 'react-router';
import PageHeader from '~/components/PageHeader';
import TeamCard from '~/components/TeamCard';
import SearchInput from '~/components/SearchInput';
import FilterTabs from '~/components/FilterTabs';
import Pagination from '~/components/Pagination';
import type { Route } from './+types/teams';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Teams' }];
}

interface Team {
	id: string;
	name: string;
	memberCount: number;
	maxMembers: number;
	captainName: string;
	eventsParticipated: number;
	totalPoints: number;
	isOpen: boolean;
	hasRequested?: boolean;
}

// Mock data - Replace
const mockTeams: Team[] = [
	{
		id: '1',
		name: 'Cyber Warriors',
		memberCount: 4,
		maxMembers: 5,
		captainName: 'Alice_CTF',
		eventsParticipated: 12,
		totalPoints: 5680,
		isOpen: true,
		hasRequested: false,
	},
	{
		id: '2',
		name: 'Binary Bandits',
		memberCount: 5,
		maxMembers: 5,
		captainName: 'Bob_Hacker',
		eventsParticipated: 8,
		totalPoints: 4320,
		isOpen: true,
		hasRequested: false,
	},
	{
		id: '3',
		name: 'Shell Shockers',
		memberCount: 3,
		maxMembers: 6,
		captainName: 'Charlie_Sec',
		eventsParticipated: 15,
		totalPoints: 7890,
		isOpen: true,
		hasRequested: false,
	},
	{
		id: '4',
		name: 'Pwn Masters',
		memberCount: 4,
		maxMembers: 4,
		captainName: 'David_Pwn',
		eventsParticipated: 20,
		totalPoints: 9540,
		isOpen: false,
		hasRequested: false,
	},
	{
		id: '5',
		name: 'Crypto Crew',
		memberCount: 2,
		maxMembers: 5,
		captainName: 'Eve_Cipher',
		eventsParticipated: 6,
		totalPoints: 3210,
		isOpen: true,
		hasRequested: false,
	},
	{
		id: '6',
		name: 'Reverse Engineers',
		memberCount: 5,
		maxMembers: 5,
		captainName: 'Frank_Rev',
		eventsParticipated: 18,
		totalPoints: 8750,
		isOpen: false,
		hasRequested: false,
	},
	{
		id: '7',
		name: 'Web Exploiters',
		memberCount: 3,
		maxMembers: 5,
		captainName: 'Grace_Web',
		eventsParticipated: 10,
		totalPoints: 4560,
		isOpen: true,
		hasRequested: false,
	},
	{
		id: '8',
		name: 'Malware Analysts',
		memberCount: 4,
		maxMembers: 6,
		captainName: 'Henry_Mal',
		eventsParticipated: 14,
		totalPoints: 6320,
		isOpen: true,
		hasRequested: false,
	},
];

export default function Page() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [teams, setTeams] = useState<Team[]>(mockTeams);

	const searchQuery = searchParams.get('q') || '';
	const statusFilter = (searchParams.get('status') || 'all') as
		| 'all'
		| 'open'
		| 'closed';
	const currentPage = parseInt(searchParams.get('page') || '1', 10);
	const itemsPerPage = parseInt(searchParams.get('perPage') || '6', 10);

	const filteredTeams = teams.filter((team) => {
		const matchesSearch = team.name
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesStatus =
			statusFilter === 'all' ||
			(statusFilter === 'open' && team.isOpen) ||
			(statusFilter === 'closed' && !team.isOpen);
		return matchesSearch && matchesStatus;
	});

	const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedTeams = filteredTeams.slice(
		startIndex,
		startIndex + itemsPerPage
	);

	const handleRequestJoin = (teamId: string) => {
		// TODO: Implement
		setTeams((prev) =>
			prev.map((team) =>
				team.id === teamId ? { ...team, hasRequested: true } : team
			)
		);
		console.log('Request to join team:', teamId);
	};

	const handleCancelRequest = (teamId: string) => {
		// TODO: Implement
		setTeams((prev) =>
			prev.map((team) =>
				team.id === teamId ? { ...team, hasRequested: false } : team
			)
		);
		console.log('Canceled request to join team:', teamId);
	};

	const handlePageChange = (page: number) => {
		const newParams = new URLSearchParams(searchParams);
		newParams.set('page', page.toString());
		setSearchParams(newParams);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const handleItemsPerPageChange = (items: number) => {
		const newParams = new URLSearchParams(searchParams);
		newParams.set('perPage', items.toString());
		newParams.delete('page');
		setSearchParams(newParams);
	};

	const statusTabs = [
		{ value: 'all', label: 'All Teams', count: teams.length },
		{
			value: 'open',
			label: 'Open',
			count: teams.filter((t) => t.isOpen).length,
		},
		{
			value: 'closed',
			label: 'Closed',
			count: teams.filter((t) => !t.isOpen).length,
		},
	];

	return (
		<>
			<PageHeader title="Teams" />

			<main
				id="main-content"
				className="flex flex-col h-full max-w-7xl mx-auto px-4 py-8"
			>
				<div className="mb-6">
					<SearchInput
						value={searchQuery}
						onChange={(value) => {
							const newParams = new URLSearchParams(searchParams);
							if (value) {
								newParams.set('q', value);
							} else {
								newParams.delete('q');
							}
							newParams.delete('page');
							setSearchParams(newParams);
						}}
						placeholder="Search teams..."
						aria-label="Search for teams"
					/>
				</div>

				<FilterTabs
					tabs={statusTabs}
					activeTab={statusFilter}
					onChange={(tab) => {
						const newParams = new URLSearchParams(searchParams);
						newParams.set('status', tab);
						newParams.delete('page');
						setSearchParams(newParams);
					}}
				/>

				{filteredTeams.length === 0 ? (
					<div
						className="text-center py-12 mt-6"
						role="status"
						aria-live="polite"
						aria-atomic="true"
					>
						<p className="text-dark/60 text-lg">
							{searchQuery
								? `No teams found matching "${searchQuery}"`
								: 'No teams available'}
						</p>
					</div>
				) : (
					<>
						<div
							className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"
							role="list"
							aria-label="List of teams"
						>
							{paginatedTeams.map((team) => (
								<div key={team.id} role="listitem">
									<TeamCard
										{...team}
										isFull={team.memberCount >= team.maxMembers}
										onRequestJoin={() => handleRequestJoin(team.id)}
										onCancelRequest={() => handleCancelRequest(team.id)}
									/>
								</div>
							))}
						</div>

						<Pagination
							currentPage={currentPage}
							totalPages={Math.max(1, totalPages)}
							totalItems={filteredTeams.length}
							itemsPerPage={itemsPerPage}
							onPageChange={handlePageChange}
							onItemsPerPageChange={handleItemsPerPageChange}
							className="mt-auto mb-12"
						/>
					</>
				)}
			</main>
		</>
	);
}
