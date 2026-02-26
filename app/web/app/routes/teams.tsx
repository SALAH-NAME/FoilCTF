import { data, Form, useSearchParams } from 'react-router';
import { useEffect, useState, type SubmitEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Route } from './+types/teams';

import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import TeamCard from '~/components/TeamCard';
import FilterTabs from '~/components/FilterTabs';
import Pagination from '~/components/Pagination';
import PageHeader from '~/components/PageHeader';
import SearchInput from '~/components/SearchInput';
import FormInput from '~/components/FormInput';
import { useToast } from '~/contexts/ToastContext';
import { request_session } from '~/session.server';
import { fetch_user } from './profile';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Teams' }];
}

async function remote_fetch_teams(q: string, page: number, limit: number) {
	const url = new URL('/api/teams', import.meta.env.BROWSER_REST_USER_ORIGIN);
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
			description: string | null;
			is_locked: boolean | null;
		}[];
		limit: number;
		page: number;
	};
	return json as JSONData_Teams;
}
async function remote_fetch_user_requests(token: string) {
	const url = new URL('/api/users/me/requests', import.meta.env.BROWSER_REST_USER_ORIGIN);
	const res = await fetch(url, {
		headers: {
			'Authorization': `Bearer ${token}`,
		},
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok)
		throw new Error(json.error ?? 'Internal server error');

	type JSONData_Teams = {
		data: string[];
	};
	return (json as JSONData_Teams).data;
}
async function remote_request_team_join(token: string, team_name: string) {
	const url = new URL(`/api/teams/${team_name}/requests`, import.meta.env.BROWSER_REST_USER_ORIGIN);
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${token}`,
		},
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok)
		throw new Error(json.error ?? 'Internal server error');

	type JSONData_Teams = {
		data: string[];
	};
	return (json as JSONData_Teams).data;
}
async function remote_request_team_cancel(token: string, team_name: string) {
	const url = new URL(`/api/teams/${team_name}/requests`, import.meta.env.BROWSER_REST_USER_ORIGIN);
	const res = await fetch(url, {
		method: 'DELETE',
		headers: {
			'Authorization': `Bearer ${token}`,
		},
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok)
		throw new Error(json.error ?? 'Internal server error');
}

export async function loader({ request }: Route.LoaderArgs) {
	const session = await request_session(request);
	return data({ user: session.get('user') });
}
export default function Page({ loaderData }: Route.ComponentProps) {
	const { user: session_user } = loaderData;
	const token = session_user?.token_access;

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

	const query_requests = useQuery({
		queryKey: ['user-requests', { user: session_user?.username }, { token }],
		initialData: [],
		async queryFn() {
			if (!session_user?.username)
				return [];
			if (!token)
				return [];

			return await remote_fetch_user_requests(token);
		},
	});
	const teams_requested = query_requests.data;
	useEffect(() => {
		console.log(teams_requested);
	}, [teams_requested]);

	function execFilterTeams<T extends { name: string, is_locked: boolean | null }>(teams: T[]) {
		return teams.map(team => {
			return {
				...team,
				has_requested: teams_requested.indexOf(team.name) !== -1,
			};
		}).filter(team => {
			const matchesSearch = team.name
				.toLowerCase()
				.includes(searchQuery.toLowerCase());
			const matchesStatus =
				statusFilter === 'all' ||
				(statusFilter === 'open' && !team.is_locked) ||
				(statusFilter === 'closed' && team.is_locked);
			return matchesSearch && matchesStatus;
		});
	}

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
	const teams = execFilterTeams(query_teams.data);

	const totalPages = Math.ceil(teams.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedTeams = teams.slice(
		startIndex,
		startIndex + itemsPerPage
	);

	const queryClient = useQueryClient();
	const { addToast } = useToast();

	const mut_request_join = useMutation<unknown, Error, RequestPayload<{ team_name: string }>>({
		async mutationFn({ token, team_name }) {
			if (!token)
				throw new Error('Unauthorized');
			if (!team_name)
				throw new Error('Who is you even asking to join?');
			await remote_request_team_join(token, team_name);
		},
		async onSuccess() {
			const invalidate_user_requests = queryClient.invalidateQueries({ queryKey: ['user-requests'] });
			const invalidate_teams = queryClient.invalidateQueries({ queryKey: ['teams'] });
			await Promise.all([invalidate_user_requests, invalidate_teams]);
			addToast({
				variant: 'success',
				title: 'Team join request',
				message: 'Your request has been sent successfully',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Team join request failed',
				message: err.message,
			});
		}
	});
	const handleRequestJoin = (team_name: string) => mut_request_join.mutate({ token, team_name });

	const mut_request_cancel = useMutation<unknown, Error, RequestPayload<{ team_name: string }>>({
		async mutationFn({ token, team_name }) {
			if (!token)
				throw new Error('Unauthorized');
			if (!team_name)
				throw new Error('Who is you even asking to cancel?');
			await remote_request_team_cancel(token, team_name);
		},
		async onSuccess() {
			const invalidate_user_requests = queryClient.invalidateQueries({ queryKey: ['user-requests'] });
			const invalidate_teams = queryClient.invalidateQueries({ queryKey: ['teams'] });
			await Promise.all([invalidate_user_requests, invalidate_teams]);
			addToast({
				variant: 'success',
				title: 'Team join request',
				message: 'Your request has been cancelled',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Team join request cancellation failed',
				message: err.message,
			});
		}
	});
	const handleCancelRequest = (team_name: string) => mut_request_cancel.mutate({ token, team_name });
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

	const query_user = useQuery({
		queryKey: [
			'user',
			{ username: session_user?.username },
			{ token_access: session_user?.token_access },
		],
		initialData: null,
		queryFn: async () => {
			if (!session_user)
				return null;
			return await fetch_user(session_user.token_access);
		},
	});
	const user = query_user.data;

	const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
	const PageHeaderAction = () => (
		<>
			{ !user?.team_name && session_user?.username &&
			<Button variant="primary" onClick={() => setShowCreateTeamModal(true)} disabled={showCreateTeamModal}>
				<Icon name="add" />
				<span>Start a Team</span>
			</Button> }
		</>
	);
	return (
		<>
			<PageHeader
				title="Teams"
				action={<PageHeaderAction />}
			/>

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

				{teams.length === 0 ? (
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
										can_request={!Boolean(user?.team_name) && user?.team_name !== team.name}
										onRequestJoin={() => handleRequestJoin(team.name)}
										onCancelRequest={() => handleCancelRequest(team.name)}
									/>
								</div>
							))}
						</div>

						<Pagination
							currentPage={currentPage}
							totalPages={Math.max(1, totalPages)}
							totalItems={teams.length}
							itemsPerPage={itemsPerPage}
							onPageChange={handlePageChange}
							onItemsPerPageChange={handleItemsPerPageChange}
							className="mt-auto mb-12"
						/>
					</>
				)}
			</main>

			<ModalCreateTeam isOpen={showCreateTeamModal} closeModal={() => setShowCreateTeamModal(false)} token={token} />
		</>
	);
}

type RequestPayload<T> = {
	token?: string | null;
} & T;
export async function remote_create_team(token: string, name: string) {
	const uri = new URL('/api/teams', import.meta.env.BROWSER_REST_USER_ORIGIN);
	const res = await fetch(uri, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`,
		},
		body: JSON.stringify({ name }),
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok)
		throw new Error(json.error ?? 'Internal server error');
}

type ModalCreateTeamProps = {
	isOpen: boolean;
	closeModal: () => void;

	token?: string | null;
}
const ModalCreateTeam = ({ isOpen, closeModal, token }: ModalCreateTeamProps) => {
	const [teamName, setTeamName] = useState<string>('');
	const [errorTeamName, setErrorTeamName] = useState<string | undefined>();
	useEffect(() => {
		if (!teamName)
			return ;

		if (teamName.length < 4)
			setErrorTeamName('Team name must be 4 characters minimum');
		else if (teamName.length > 15)
			setErrorTeamName('Team name must be 15 characters maximum');
		else if (!/^[A-Za-z0-9_]+$/.test(teamName))
			setErrorTeamName('Team name only allows underscores, alphabetical, and numerical characters')
		else
			setErrorTeamName(undefined);
	}, [teamName]);

	const queryClient = useQueryClient();
	const { addToast } = useToast();

	const mut_submit = useMutation<unknown, Error, RequestPayload<{ name: string }>>({
		async mutationFn({ token, name }) {
			if (!token)
				throw new Error('Unauthorized');
			await remote_create_team(token, name);
		},
		async onSuccess() {
			const invalidate_teams = queryClient.invalidateQueries({ });
			await Promise.all([invalidate_teams]);
			addToast({
				variant: 'success',
				title: 'Team',
				message: 'Your team has been created successfully',
			});

			closeModal();
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Team creation failed',
				message: err.message,
			});
		}
	});

	const resetModal = () => {
		setTeamName('');
		closeModal();
	};
	const submitModal = (ev: SubmitEvent<HTMLFormElement>) => {
		ev.preventDefault();
		if (!teamName) {
			setErrorTeamName('Must not be empty')
			return ;
		}
		if (errorTeamName) {
			console.log(errorTeamName);
			return ;
		}
		mut_submit.mutate({ token, name: teamName });
		resetModal();
	};
	return (
		<Modal
			isOpen={isOpen}
			onClose={closeModal}
			title="Create a team"
			footer={
				<div className="flex gap-3 justify-end">
					<Button
						variant="secondary"
						onClick={resetModal}
						type="button"
					>
						Cancel
					</Button>
					<Button type="submit" form="form-team-create">
						Submit
					</Button>
				</div>
			}
		>
			<Form
				id="form-team-create"
				onSubmit={submitModal}
				className="space-y-4"
			>
				<FormInput
					id="input-team-name"
					name="name"
					type="text"
					label="Name"
					value={teamName}
					onChange={ev => setTeamName(ev.target.value)}
					error={errorTeamName}
					placeholder="hackers_1995"
					required
				/>
			</Form>
		</Modal>
	);
};
