import { useState } from 'react';
import { data, useSearchParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { Route } from './+types/index';

import { fmtDateTime } from '~/utils';
import { api_challenge_delete } from '~/api';

import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Spinner from '~/components/Spinner';
import FilterTabs from '~/components/FilterTabs';
import PageHeader from '~/components/PageHeader';
import Pagination from '~/components/Pagination';
import SearchInput from '~/components/SearchInput';
import type { Challenge } from '~/components/AdminChallengeModal';
import AdminChallengeModal from '~/components/AdminChallengeModal';
import { request_session_user } from '~/session.server';
import { useToast } from '~/contexts/ToastContext';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Challenges' }];
}
export async function loader({ request }: Route.LoaderArgs) {
	const user = await request_session_user(request);
	return data({ user });
}

type StatusFilter = 'all' | 'published' | 'draft';

export async function remote_fetch_challenges(token: string, search: string, limit: number, offset: number, status: 'published' | 'draft' | 'all') {
	const uri = new URL(
		`/api/challenges`,
		import.meta.env.BROWSER_REST_CHALLENGES_ORIGIN
	);
	if (search)
		uri.searchParams.set('search', search);
	if (status !== 'all')
		uri.searchParams.set('status', status);
	if (isFinite(limit))
		uri.searchParams.set('limit', limit.toString());
	if (isFinite(offset))
		uri.searchParams.set('offset', offset.toString());

	const headers = new Headers({ 'Authorization': `Bearer ${token}` });
	const res = await fetch(uri, { headers });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');

	type JSONData_Challenges = {
		challenges: {
			id: number;
			is_published: boolean;
			name: string;
			description: string;
			category: string;
			reward: number;
			reward_min: number;
			reward_first_blood: number;
			reward_decrements: boolean;
			author_id: number;
			created_at: string;
			updated_at: string;
		}[];
		count: number;
	};
	return json as JSONData_Challenges;
}
export async function remote_delete_challenge(token: string, id: number) {
	const uri = new URL(
		`/api/challenges/${id}`,
		import.meta.env.BROWSER_REST_CHALLENGES_ORIGIN
	);
	const method = 'DELETE';
	const headers = new Headers({ 'Authorization': `Bearer ${token}` });
	const res = await fetch(uri, { method, headers });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
}

export default function Page({ loaderData }: Route.ComponentProps) {
	const queryClient = useQueryClient();
	const [searchQuery, setSearchQuery] = useState('');
	const [searchParams, setSearchParams] = useSearchParams();

	// Modal state
	const [deleteTarget, setDeleteTarget] = useState<Challenge | null>(null);
	const [editChallenge, setEditChallenge] = useState<Challenge | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);

	// Filter state
	const filterParam = searchParams.get('status') as StatusFilter | null;
	const activeFilter: StatusFilter = filterParam ?? 'all';

	const currentPage = parseInt(searchParams.get('page') || '1', 10);
	const itemsPerPage = parseInt(searchParams.get('perPage') || '10', 10);

	const { user } = loaderData;

	// Fetch challenges
	const {
		data: { challenges, count: challenges_count },
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ['challenges', { username: user?.username, searchQuery, currentPage, itemsPerPage, activeFilter }],
		initialData: { challenges: [], count: 0 },
		async queryFn() {
			if (!user)
				return { challenges: [], count: 0 };
			const { username } = user;
			return await remote_fetch_challenges(username, searchQuery, itemsPerPage, (currentPage - 1) * itemsPerPage, activeFilter);
		},
	});

	const { addToast } = useToast();

	// Delete mutation
	const mut_delete = useMutation<unknown, Error, { token?: string, id: number }>({
		mutationFn: async ({ token, id }) => {
			if (!token)
				throw new Error('Unauthorized');
			await remote_delete_challenge(token, id);
		},
		async onSuccess() {
			await queryClient.invalidateQueries({ queryKey: ['challenges'] });
			setDeleteTarget(null);
			addToast({
				variant: 'success',
				title: 'Challenge deleted',
				message: 'Challenge has been deleted successfully',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Challenge deletion',
				message: err.message,
			});
		},
	});

	// Pagination
	const totalPages = Math.max(
		1,
		Math.ceil(challenges_count / itemsPerPage)
	);

	const handleFilterChange = (value: string) => {
		const newParams = new URLSearchParams(searchParams);
		newParams.delete('page');
		if (value === 'all') {
			newParams.delete('status');
		} else {
			newParams.set('status', value);
		}
		setSearchParams(newParams);
	};

	const handlePageChange = (page: number) => {
		const newParams = new URLSearchParams(searchParams);
		newParams.set('page', page.toString());
		setSearchParams(newParams);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	// Filter counts
	const counts = {
		all: challenges.length,
		published: challenges.filter((c) => c.is_published).length,
		draft: challenges.filter((c) => !c.is_published).length,
	};

	const filters = [
		{ id: 'all', label: 'All', count: counts.all },
		{ id: 'published', label: 'Published', count: counts.published },
		{ id: 'draft', label: 'Draft', count: counts.draft },
	];

	return (
		<>
			<PageHeader
				title="Challenges"
				action={
					<Button
						onClick={() => setShowCreateModal(true)}
						aria-label="Create a new challenge"
					>
						<Icon name="add" className="size-4" aria-hidden={true} />
						New Challenge
					</Button>
				}
			/>

			<div className="flex flex-col gap-4 md:gap-6 min-w-0 w-full max-w-7xl mx-auto px-4 py-4">
				<SearchInput
					value={searchQuery}
					onChange={setSearchQuery}
					placeholder="Search challenges..."
				/>

				<FilterTabs
					tabs={filters.map((f) => ({
						label: f.label,
						value: f.id,
						count: f.count,
					}))}
					activeTab={activeFilter}
					onChange={handleFilterChange}
				/>

				<div aria-live="polite" aria-atomic="true" className="sr-only">
					{challenges_count} challenges found
				</div>

				{isLoading && (
					<div className="flex items-center justify-center py-12">
						<Spinner scale={2} />
						<span className="sr-only">Loading challenges...</span>
					</div>
				)}

				{isError && (
					<div
						className="bg-red-50 border border-red-200 rounded-md p-6 text-center"
						role="alert"
					>
						<p className="text-red-800 font-semibold mb-1">
							Failed to load challenges
						</p>
						<p className="text-sm text-red-600">
							{error instanceof Error ? error.message : 'Unknown error'}
						</p>
					</div>
				)}

				{!isLoading && !isError && challenges_count === 0 && (
					<div className="text-center py-12">
						<p className="text-muted">
							{searchQuery || activeFilter !== 'all'
								? 'No challenges found matching your criteria.'
								: 'No challenges yet. Create your first challenge!'}
						</p>
					</div>
				)}

				{!isLoading && !isError && challenges_count > 0 && (
					<>
						<div
							className="bg-white border border-neutral-300 rounded-md overflow-hidden"
							role="table"
							aria-label="Challenges list"
						>
							<div
								className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 bg-neutral-50 border-b border-neutral-300 text-sm font-semibold text-dark"
								role="row"
							>
								<span className="col-span-4" role="columnheader">
									Name
								</span>
								<span className="col-span-2" role="columnheader">
									Reward
								</span>
								<span className="col-span-2" role="columnheader">
									Status
								</span>
								<span className="col-span-2" role="columnheader">
									Created
								</span>
								<span className="col-span-2 text-right" role="columnheader">
									Actions
								</span>
							</div>

							{challenges.map((challenge) => (
								<div
									key={challenge.id}
									className="grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-3 border-b border-neutral-200 last:border-b-0 items-center hover:bg-neutral-50 transition-colors"
									role="row"
								>
									<div className="md:col-span-4" role="cell">
										<button
											type="button"
											onClick={() => setEditChallenge(challenge)}
											className="text-left font-medium text-dark bg-primary/10 hover:text-primary transition-colors truncate w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
											aria-label={`Edit challenge ${challenge.name}`}
										>
											{challenge.name}
										</button>
										{challenge.description && (
											<p className="text-xs text-muted mt-0.5 line-clamp-1">
												{challenge.description}
											</p>
										)}
									</div>

									<div className="md:col-span-2" role="cell">
										<div className="flex items-center gap-1">
											<span className="md:hidden text-xs text-muted">
												Reward:{' '}
											</span>
											<span className="text-sm font-semibold text-primary">
												{challenge.reward} pts
											</span>
											{challenge.reward_decrements && (
												<span
													className="text-xs text-muted"
													title={`Min: ${challenge.reward_min} pts`}
												>
													↓{challenge.reward_min}
												</span>
											)}
										</div>
										{challenge.reward_first_blood > 0 && (
											<span className="text-xs text-amber-600">
												+{challenge.reward_first_blood} first blood
											</span>
										)}
									</div>

									<div className="md:col-span-2" role="cell">
										<span
											className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
												challenge.is_published
													? 'bg-green-100 text-green-700'
													: 'bg-neutral-100 text-neutral-600'
											}`}
											role="status"
											aria-label={`Status: ${challenge.is_published ? 'Published' : 'Draft'}`}
										>
											{challenge.is_published ? 'Published' : 'Draft'}
										</span>
									</div>

									<div className="md:col-span-2" role="cell">
										<span className="text-sm text-muted">
											{fmtDateTime(challenge.created_at)}
										</span>
									</div>

									<div
										className="md:col-span-2 flex items-center gap-1 md:justify-end"
										role="cell"
									>
										<button
											type="button"
											onClick={() => setEditChallenge(challenge)}
											className="p-2 text-white hover:text-primary hover:bg-primary/10 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
											aria-label={`Edit ${challenge.name}`}
											title="Edit challenge"
										>
											<Icon name="edit" className="size-4" aria-hidden={true} />
										</button>
										<button
											type="button"
											onClick={() => setDeleteTarget(challenge)}
											className="p-2 text-white hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
											aria-label={`Delete ${challenge.name}`}
											title="Delete challenge"
										>
											<Icon
												name="trash"
												className="size-4"
												aria-hidden={true}
											/>
										</button>
									</div>
								</div>
							))}
						</div>

						<Pagination
							currentPage={currentPage}
							totalPages={totalPages}
							totalItems={challenges_count}
							itemsPerPage={itemsPerPage}
							onPageChange={handlePageChange}
							onItemsPerPageChange={(items) => {
								const newParams = new URLSearchParams(searchParams);
								newParams.set('perPage', items.toString());
								newParams.delete('page');
								setSearchParams(newParams);
							}}
						/>
					</>
				)}
			</div>

			<AdminChallengeModal
				user={user}
				isOpen={showCreateModal || !!editChallenge}
				onClose={() => {
					setShowCreateModal(false);
					setEditChallenge(null);
				}}
				challenge={editChallenge}
			/>

			<Modal
				isOpen={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				title="Delete Challenge"
				size="sm"
				footer={
					<div className="flex gap-3 justify-end">
						<Button
							variant="secondary"
							onClick={() => setDeleteTarget(null)}
							disabled={mut_delete.status === 'pending'}
						>
							Cancel
						</Button>
						<Button
							variant="danger"
							onClick={() => deleteTarget && mut_delete.mutate({ token: user?.token_access, id: deleteTarget.id })}
							disabled={mut_delete.status === 'pending'}
							aria-label="Confirm deletion"
						>
							{mut_delete.status === 'pending' ? (
								<>
									<Spinner scale={0.7} />
									Deleting...
								</>
							) : (
								'Delete'
							)}
						</Button>
					</div>
				}
			>
				<div className="space-y-4">
					<p className="text-foreground">
						Are you sure you want to delete{' '}
						<strong className="font-semibold">{deleteTarget?.name}</strong>?
					</p>
					<div
						className="bg-red-50 border border-red-200 rounded-md p-4"
						role="alert"
					>
						<div className="flex gap-3">
							<Icon
								name="warning"
								className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
								aria-hidden={true}
							/>
							<div className="flex-1">
								<h3 className="font-semibold text-red-900 mb-1">
									This action cannot be undone
								</h3>
								<p className="text-sm text-red-800">
									All associated attachments, instances, and event links will be
									permanently removed.
								</p>
							</div>
						</div>
					</div>
					{mut_delete.status === 'error' && (
						<p className="text-sm text-red-600" role="alert">
							Failed to delete challenge. Please try again.
						</p>
					)}
				</div>
			</Modal>
		</>
	);
}
