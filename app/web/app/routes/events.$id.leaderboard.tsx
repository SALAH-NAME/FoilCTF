import { useState } from 'react';
import { useSearchParams } from 'react-router';
import PageHeader from '~/components/PageHeader';
import SearchInput from '~/components/SearchInput';
import Pagination from '~/components/Pagination';
import Icon from '~/components/Icon';
import type { Route } from './+types/events.$id.leaderboard';

interface LeaderboardEntry {
	rank: number;
	team: string;
	score: number;
	solves: number;
	lastSolve: string;
}

export function meta({ params }: Route.ComponentProps) {
	return [
		{ title: `Leaderboard - Event ${params.id} - FoilCTF` },
		{ name: 'description', content: `Event leaderboard for ${params.id}` },
	];
}

export default function EventLeaderboard({ params }: Route.ComponentProps) {
	const [searchParams, setSearchParams] = useSearchParams();
	const [searchQuery, setSearchQuery] = useState('');

	const currentPage = parseInt(searchParams.get('page') || '1', 10);
	const itemsPerPage = parseInt(searchParams.get('perPage') || '10', 10);

	// Mock leaderboard data
	const allLeaderboard: LeaderboardEntry[] = [
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

	const filteredLeaderboard = searchQuery
		? allLeaderboard.filter((entry) =>
				entry.team.toLowerCase().includes(searchQuery.toLowerCase())
			)
		: allLeaderboard;

	const totalPages = Math.ceil(filteredLeaderboard.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedLeaderboard = filteredLeaderboard.slice(
		startIndex,
		startIndex + itemsPerPage
	);

	const handleSearch = (query: string) => {
		setSearchQuery(query);
		const newParams = new URLSearchParams(searchParams);
		if (query) {
			newParams.set('q', query);
		} else {
			newParams.delete('q');
		}
		newParams.delete('page');
		setSearchParams(newParams);
	};

	const handlePageChange = (page: number) => {
		const newParams = new URLSearchParams(searchParams);
		newParams.set('page', page.toString());
		setSearchParams(newParams);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const getRankBadge = (rank: number) => {
		if (rank === 1) {
			return (
				<span className="text-2xl" role="img" aria-label="First place">
					🥇
				</span>
			);
		}
		if (rank === 2) {
			return (
				<span className="text-2xl" role="img" aria-label="Second place">
					🥈
				</span>
			);
		}
		if (rank === 3) {
			return (
				<span className="text-2xl" role="img" aria-label="Third place">
					🥉
				</span>
			);
		}
		return (
			<span
				className="text-lg font-semibold text-dark/70"
				aria-label={`Rank ${rank}`}
			>
				#{rank}
			</span>
		);
	};

	return (
		<>
			<PageHeader title={`Event ${params.id} Leaderboard`} />

			<main
				id="main-content"
				className="max-w-7xl mx-auto px-4 py-8 flex flex-col"
			>
				<div className="mb-6">
					<SearchInput
						value={searchQuery}
						onChange={handleSearch}
						placeholder="Search teams..."
						aria-label="Search teams in leaderboard"
					/>
				</div>

				{filteredLeaderboard.length === 0 ? (
					<div
						className="bg-white/70 rounded-md p-8 border border-dark/10 text-center"
						role="status"
						aria-live="polite"
					>
						<p className="text-dark/60">
							No teams found matching "{searchQuery}"
						</p>
					</div>
				) : (
					<>
						<div
							className="md:hidden space-y-4 mb-8"
							role="list"
							aria-label="Leaderboard entries"
						>
							{paginatedLeaderboard.map((entry) => (
								<div
									key={entry.rank}
									role="listitem"
									className="bg-white rounded-md p-4 border border-dark/10 hover:border-primary/30 transition-colors"
								>
									<div className="flex items-center justify-between mb-3">
										<div className="flex items-center gap-3">
											<div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
												{getRankBadge(entry.rank)}
											</div>
											<div>
												<h3 className="font-semibold text-dark text-lg">
													{entry.team}
												</h3>
												<p className="text-sm text-dark/60">
													Rank #{entry.rank}
												</p>
											</div>
										</div>
									</div>
									<div className="grid grid-cols-3 gap-3 pt-3 border-t border-dark/10">
										<div className="text-center">
											<p className="text-xs text-dark/60 mb-1">Score</p>
											<p className="font-bold text-primary text-lg">
												{entry.score.toLocaleString()}
											</p>
										</div>
										<div className="text-center">
											<p className="text-xs text-dark/60 mb-1">Solves</p>
											<p className="font-semibold text-dark">{entry.solves}</p>
										</div>
										<div className="text-center">
											<p className="text-xs text-dark/60 mb-1">Last Solve</p>
											<p className="font-medium text-dark text-xs">
												{entry.lastSolve}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>

						<div className="hidden md:block bg-white rounded-md border border-dark/10 overflow-hidden mb-8">
							<div className="overflow-x-auto">
								<table
									className="w-full"
									role="table"
									aria-label="Team leaderboard"
								>
									<thead>
										<tr className="bg-dark/5 border-b border-dark/10">
											<th
												scope="col"
												className="text-center py-4 px-6 text-sm font-semibold text-dark"
											>
												Rank
											</th>
											<th
												scope="col"
												className="text-left py-4 px-6 text-sm font-semibold text-dark"
											>
												Team
											</th>
											<th
												scope="col"
												className="text-center py-4 px-6 text-sm font-semibold text-dark"
											>
												Score
											</th>
											<th
												scope="col"
												className="text-center py-4 px-6 text-sm font-semibold text-dark"
											>
												Solves
											</th>
											<th
												scope="col"
												className="text-center py-4 px-6 text-sm font-semibold text-dark"
											>
												Last Solve
											</th>
										</tr>
									</thead>
									<tbody>
										{paginatedLeaderboard.map((entry) => (
											<tr
												key={entry.rank}
												className="border-b border-dark/10 last:border-0 hover:bg-dark/5 transition-colors"
											>
												<td className="py-4 px-6">
													<div className="flex items-center justify-center">
														{getRankBadge(entry.rank)}
													</div>
												</td>
												<td className="py-4 px-6">
													<span className="font-semibold text-dark">
														{entry.team}
													</span>
												</td>
												<td className="py-4 px-6 text-center">
													<span className="font-bold text-primary text-lg">
														{entry.score.toLocaleString()}
													</span>
												</td>
												<td className="py-4 px-6 text-center">
													<span className="text-dark/70 font-medium">
														{entry.solves}
													</span>
												</td>
												<td className="py-4 px-6 text-center">
													<span className="text-sm text-dark/60">
														{entry.lastSolve}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>

						<Pagination
							currentPage={currentPage}
							totalPages={Math.max(1, totalPages)}
							onPageChange={handlePageChange}
							itemsPerPage={itemsPerPage}
							onItemsPerPageChange={(items) => {
								const newParams = new URLSearchParams(searchParams);
								newParams.set('perPage', items.toString());
								newParams.delete('page');
								setSearchParams(newParams);
							}}
							className="mt-auto"
						/>
					</>
				)}

				<div className="mt-8 bg-primary/5 border border-primary/20 rounded-md p-6">
					<h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
						<Icon
							name="info"
							className="size-5 text-primary"
							aria-hidden={true}
						/>
						How Rankings Work
					</h3>
					<ul className="space-y-2 text-sm text-dark/70">
						<li className="flex items-start gap-2">
							<span className="text-primary font-bold">•</span>
							<span>
								Teams are ranked by total score from solved challenges
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-primary font-bold">•</span>
							<span>Each challenge has a point value based on difficulty</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-primary font-bold">•</span>
							<span>Faster solves may earn bonus points in some events</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-primary font-bold">•</span>
							<span>Rankings update in real-time as challenges are solved</span>
						</li>
					</ul>
				</div>

				<div
					className="sr-only"
					role="status"
					aria-live="polite"
					aria-atomic="true"
				>
					{searchQuery && (
						<>
							{filteredLeaderboard.length} team
							{filteredLeaderboard.length !== 1 ? 's' : ''} found
						</>
					)}
				</div>
			</main>
		</>
	);
}
