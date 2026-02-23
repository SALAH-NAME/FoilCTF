import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import SearchInput from '../components/SearchInput';
import FilterTabs from '../components/FilterTabs';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import Spinner from '../components/Spinner';
import AdminChallengeModal from '../components/AdminChallengeModal';
import type { Challenge } from '../components/AdminChallengeModal';
import { api_challenge_list, api_challenge_delete } from '../api';
import { fmtDateTime } from '../utils';
import type { Route } from './+types/index';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Challenges' }];
}

type StatusFilter = 'all' | 'published' | 'draft';

const mockChallenges: Challenge[] = [
	{
		id: 101,
		name: 'SQL Injection 101',
		description:
			'Exploit a classic SQL injection vulnerability to extract the hidden flag from the database.',
		flag: 'flag{sql_1nj3ct10n_m4st3r}',
		reward: 200,
		reward_min: 100,
		reward_first_blood: 50,
		reward_decrements: true,
		is_published: true,
		author_id: 1,
		created_at: '2026-01-10T08:00:00Z',
		updated_at: '2026-01-10T08:00:00Z',
	},
	{
		id: 102,
		name: 'XSS Playground',
		description:
			'Find and exploit a reflected XSS vulnerability to steal the admin session cookie.',
		flag: 'flag{xss_c00k13_st3al3r}',
		reward: 300,
		reward_min: 150,
		reward_first_blood: 75,
		reward_decrements: true,
		is_published: true,
		author_id: 1,
		created_at: '2026-01-11T09:00:00Z',
		updated_at: '2026-01-11T09:00:00Z',
	},
	{
		id: 103,
		name: 'Buffer Overflow Basics',
		description:
			'Overflow the stack buffer to overwrite the return address and redirect execution to win().',
		flag: 'flag{buff3r_0v3rfl0w_w1n}',
		reward: 450,
		reward_min: 200,
		reward_first_blood: 100,
		reward_decrements: true,
		is_published: true,
		author_id: 1,
		created_at: '2026-01-12T10:00:00Z',
		updated_at: '2026-01-12T10:00:00Z',
	},
	{
		id: 104,
		name: 'RSA Factoring',
		description:
			'The RSA modulus was generated with weak primes. Factor n and recover the plaintext.',
		flag: 'flag{rsa_w34k_pr1m3s_cr4ck}',
		reward: 500,
		reward_min: 250,
		reward_first_blood: 125,
		reward_decrements: true,
		is_published: true,
		author_id: 1,
		created_at: '2026-01-13T11:00:00Z',
		updated_at: '2026-01-13T11:00:00Z',
	},
	{
		id: 105,
		name: 'Forensics: Lost Packet',
		description:
			'A pcap file holds the secret. Reconstruct the TCP stream and extract the hidden message.',
		flag: 'flag{pcap_l0st_4nd_f0und}',
		reward: 250,
		reward_min: 100,
		reward_first_blood: 60,
		reward_decrements: false,
		is_published: true,
		author_id: 1,
		created_at: '2026-01-14T12:00:00Z',
		updated_at: '2026-01-14T12:00:00Z',
	},
	{
		id: 106,
		name: 'Reverse Me',
		description:
			'Reverse engineer the binary and figure out the correct password to get the flag.',
		flag: 'flag{r3v3rs3_p4ssw0rd_g4m3}',
		reward: 400,
		reward_min: 200,
		reward_first_blood: 100,
		reward_decrements: true,
		is_published: false,
		author_id: 1,
		created_at: '2026-01-15T13:00:00Z',
		updated_at: '2026-01-15T13:00:00Z',
	},
	{
		id: 107,
		name: 'SSRF via PDF',
		description:
			'The application converts user-supplied URLs to PDFs. Pivot to the internal network.',
		flag: 'flag{ssrf_pdf_1nt3rn4l_n3t}',
		reward: 600,
		reward_min: 300,
		reward_first_blood: 150,
		reward_decrements: true,
		is_published: false,
		author_id: 1,
		created_at: '2026-01-16T14:00:00Z',
		updated_at: '2026-01-16T14:00:00Z',
	},
	{
		id: 108,
		name: 'Miscellaneous: Hello World',
		description: 'A warm-up challenge. Read the rule book and submit the flag.',
		flag: 'flag{w3lc0m3_t0_f0ilctf}',
		reward: 50,
		reward_min: 50,
		reward_first_blood: 0,
		reward_decrements: false,
		is_published: true,
		author_id: 1,
		created_at: '2026-01-17T08:00:00Z',
		updated_at: '2026-01-17T08:00:00Z',
	},
];

export default function Page() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [searchQuery, setSearchQuery] = useState('');
	const queryClient = useQueryClient();

	// Modal state
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [editChallenge, setEditChallenge] = useState<Challenge | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Challenge | null>(null);

	// Filter state
	const filterParam = searchParams.get('status') as StatusFilter | null;
	const activeFilter: StatusFilter = filterParam || 'all';
	const currentPage = parseInt(searchParams.get('page') || '1', 10);
	const itemsPerPage = parseInt(searchParams.get('perPage') || '16', 10);

	// Fetch challenges
	const {
		data: challenges,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ['challenges'],
		queryFn: async (): Promise<Challenge[]> => {
			try {
				const result = await api_challenge_list();
				const list = Array.isArray(result) ? result : [];
				return list.length > 0 ? list : mockChallenges;
			} catch {
				return mockChallenges;
			}
		},
		initialData: [],
	});

	// Delete mutation
	const mutDelete = useMutation({
		mutationFn: async (id: number) => {
			await api_challenge_delete(id);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['challenges'] });
			setDeleteTarget(null);
		},
	});

	// Filter & search
	const filteredChallenges = challenges.filter((ch) => {
		const matchesSearch = ch.name
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesFilter =
			activeFilter === 'all'
				? true
				: activeFilter === 'published'
					? ch.is_published
					: !ch.is_published;
		return matchesSearch && matchesFilter;
	});

	// Pagination
	const totalPages = Math.max(
		1,
		Math.ceil(filteredChallenges.length / itemsPerPage)
	);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedChallenges = filteredChallenges.slice(
		startIndex,
		startIndex + itemsPerPage
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
					{filteredChallenges.length} challenges found
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

				{!isLoading && !isError && filteredChallenges.length === 0 && (
					<div className="text-center py-12">
						<p className="text-muted">
							{searchQuery || activeFilter !== 'all'
								? 'No challenges found matching your criteria.'
								: 'No challenges yet. Create your first challenge!'}
						</p>
					</div>
				)}

				{!isLoading && !isError && filteredChallenges.length > 0 && (
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

							{paginatedChallenges.map((challenge) => (
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
							totalItems={filteredChallenges.length}
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
							disabled={mutDelete.status === 'pending'}
						>
							Cancel
						</Button>
						<Button
							variant="danger"
							onClick={() => deleteTarget && mutDelete.mutate(deleteTarget.id)}
							disabled={mutDelete.status === 'pending'}
							aria-label="Confirm deletion"
						>
							{mutDelete.status === 'pending' ? (
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
					{mutDelete.status === 'error' && (
						<p className="text-sm text-red-600" role="alert">
							Failed to delete challenge. Please try again.
						</p>
					)}
				</div>
			</Modal>
		</>
	);
}
