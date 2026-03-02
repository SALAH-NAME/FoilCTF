import { useSearchParams, data } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import PageHeader from '~/components/PageHeader';
import SearchInput from '~/components/SearchInput';
import Pagination from '~/components/Pagination';
import Icon from '~/components/Icon';
import type { Route } from './+types/events.$id.leaderboard';
import { request_session_user } from '~/session.server';

export function meta({ params }: Route.ComponentProps) {
	return [
		{ title: `Leaderboard - Event ${params.id} - FoilCTF` },
		{ name: 'description', content: `Live leaderboard for event ${params.id}` },
	];
}

export async function loader({ request }: Route.LoaderArgs) {
	const user = await request_session_user(request);
	return data({ user });
}

export type LeaderboardEntry = {
	rank: number;
	team_name: string;
	score: number;
	solves: number;
	last_attempt_at: string | null;
};

export async function remote_fetch_leaderboard(
	id: string,
	page: number,
	limit: number,
	q: string,
	token?: string
) {
	const url = new URL(
		`/api/events/${id}/leaderboard`,
		import.meta.env.BROWSER_REST_EVENTS_ORIGIN
	);
	url.searchParams.set('page', page.toString());
	url.searchParams.set('limit', limit.toString());
	if (q) url.searchParams.set('q', q);

	const headers = new Headers();
	if (token) headers.set('Authorization', `Bearer ${token}`);
	const res = await fetch(url, { headers });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');

	type JSONData_Leaderboard = {
		leaderboard: LeaderboardEntry[];
		count: number;
	};
	return json as JSONData_Leaderboard;
}

export default function EventLeaderboard({
	params,
	loaderData,
}: Route.ComponentProps) {
	const { user } = loaderData;
	const [searchParams, setSearchParams] = useSearchParams();
	const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

	const currentPage = Math.max(parseInt(searchParams.get('page') || '1'), 1);
	const itemsPerPage = Math.max(
		parseInt(searchParams.get('perPage') || '10'),
		1
	);

	const query_leaderboard = useQuery({
		queryKey: [
			'leaderboard',
			params.id,
			{
				page: currentPage,
				limit: itemsPerPage,
				q: searchParams.get('q') || '',
				token: user?.token_access,
			},
		],
		queryFn: () =>
			remote_fetch_leaderboard(
				params.id,
				currentPage,
				itemsPerPage,
				searchParams.get('q') || '',
				user?.token_access
			),
		initialData: { leaderboard: [], count: 0 },
		refetchInterval: 5000,
	});

	const { leaderboard, count } = query_leaderboard.data;
	const totalPages = Math.max(1, Math.ceil(count / itemsPerPage));

	const handleSearch = (query: string) => {
		setSearchQuery(query);
	};

	useEffect(() => {
		const idDebounce = setTimeout(() => {
			const newParams = new URLSearchParams(searchParams);
			if (searchQuery) {
				newParams.set('q', searchQuery);
			} else {
				newParams.delete('q');
			}
			newParams.delete('page');
			setSearchParams(newParams);
		}, 200);
		return () => clearTimeout(idDebounce);
	}, [searchQuery]);

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

	const formatLastSolve = (ts: string | null): string => {
		if (!ts) return '—';
		const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
		if (diff < 60) return `${diff}s ago`;
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
		return `${Math.floor(diff / 86400)}d ago`;
	};

	const isLoading = query_leaderboard.isFetching && leaderboard.length === 0;
	const isError = query_leaderboard.isError;

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

				{isError ? (
					<div
						className="bg-white/70 rounded-md p-8 border border-dark/10 text-center"
						role="alert"
					>
						<p className="text-dark/60">
							{query_leaderboard.error instanceof Error
								? query_leaderboard.error.message
								: 'Could not load leaderboard'}
						</p>
					</div>
				) : isLoading ? (
					<div
						className="bg-white/70 rounded-md p-8 border border-dark/10 text-center"
						role="status"
						aria-live="polite"
					>
						<p className="text-dark/60">Loading leaderboard…</p>
					</div>
				) : leaderboard.length === 0 ? (
					<div
						className="bg-white/70 rounded-md p-8 border border-dark/10 text-center"
						role="status"
						aria-live="polite"
					>
						<p className="text-dark/60">
							{searchQuery
								? `No teams found matching "${searchQuery}"`
								: 'No participants yet'}
						</p>
					</div>
				) : (
					<>
						<div
							className="md:hidden space-y-4 mb-8"
							role="list"
							aria-label="Leaderboard entries"
						>
							{leaderboard.map((entry) => (
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
													{entry.team_name}
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
												{formatLastSolve(entry.last_attempt_at)}
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
										{leaderboard.map((entry) => (
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
														{entry.team_name}
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
														{formatLastSolve(entry.last_attempt_at)}
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
							totalPages={totalPages}
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
							<span>Rankings update every 5 seconds automatically</span>
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
							{count} team{count !== 1 ? 's' : ''} found
						</>
					)}
				</div>
			</main>
		</>
	);
}
