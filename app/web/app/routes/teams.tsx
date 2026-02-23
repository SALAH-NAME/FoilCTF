import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import type { Route } from './+types/teams';

import PageHeader from '~/components/PageHeader';
import TeamCard from '~/components/TeamCard';
import SearchInput from '~/components/SearchInput';
import FilterTabs from '~/components/FilterTabs';
import Pagination from '~/components/Pagination';
import { useQuery } from '@tanstack/react-query';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Teams' }];
}

async function remote_fetch_teams(q: string, page: number, limit: number) {
	const url = new URL('/api/teams', import.meta.env.VITE_REST_USER_ORIGIN);
	if (q) url.searchParams.set('q', q);
	url.searchParams.set('page', page.toString());
	url.searchParams.set('limit', limit.toString());

	const res = await fetch(url);
	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
	type JSONData_Teams = {
		data: {
			id: number;
			name: string;
			captain_name: string;
			members_count: number;
			max_members: number;
			description: string | null;
			is_locked: boolean | null;
		}[];
		limit: number;
		page: number;
	};
	return json as JSONData_Teams;
}

export default function Page() {
	// const { userState: user } = useUserAuth();
	// const { token_access } = user;

	const [queryTerm, setQueryTerm] = useState<string>('');
	const [searchParams, setSearchParams] = useSearchParams();

	const searchQuery = searchParams.get('q') || '';
	const statusFilter = (searchParams.get('status') || 'all') as
		| 'all'
		| 'open'
		| 'closed';
	const currentPage = parseInt(searchParams.get('page') || '1', 10);
	const itemsPerPage = parseInt(searchParams.get('perPage') || '6', 10);
	useEffect(() => {
		const idDebounce = setTimeout(() => {
			const newParams = new URLSearchParams(searchParams);
			if (queryTerm) {
				newParams.set('q', queryTerm);
			} else {
				newParams.delete('q');
			}
			newParams.delete('page');
			setSearchParams(newParams);
		}, 200);
		return () => {
			clearTimeout(idDebounce);
		};
	}, [queryTerm]);

	const query_teams = useQuery({
		queryKey: ['teams', { searchQuery, currentPage, itemsPerPage }],
		initialData: [],
		queryFn: async ({ queryKey }) => {
			const [_queryKeyPrime, variables] = queryKey;
			if (typeof variables === 'string') return [];

			const { searchQuery, currentPage, itemsPerPage } = variables;
			const { data: teams } = await remote_fetch_teams(
				searchQuery,
				currentPage,
				itemsPerPage
			);
			return teams;
		},
	});
	// const [teams, setTeams] = useState<Team[]>(mockTeams);
	const filteredTeams = query_teams.data.filter((team) => {
		const matchesSearch = team.name
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesStatus =
			statusFilter === 'all' ||
			(statusFilter === 'open' && !team.is_locked) ||
			(statusFilter === 'closed' && team.is_locked);
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
		console.log('Request to join team:', teamId);
	};

	const handleCancelRequest = (teamId: string) => {
		// TODO: Implement
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
		{ value: 'all', label: 'All Teams', count: query_teams.data.length },
		{
			value: 'open',
			label: 'Open',
			count: query_teams.data.filter((t) => !t.is_locked).length,
		},
		{
			value: 'closed',
			label: 'Closed',
			count: query_teams.data.filter((t) => t.is_locked).length,
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
						value={queryTerm}
						onChange={setQueryTerm}
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
										isFull={team.members_count >= team.max_members}
										onRequestJoin={() => handleRequestJoin(team.name)}
										onCancelRequest={() => handleCancelRequest(team.name)}
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
