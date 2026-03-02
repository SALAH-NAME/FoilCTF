import { data } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Route } from './+types/teams.$id';

import { fetch_user } from '~/routes/profile';
import { remote_fetch_members, remote_fetch_details } from '~/routes/team';
import { request_session } from '~/session.server';

import Button from '~/components/Button';
import InfoText from '~/components/InfoText';
import StatsCard from '~/components/StatsCard';
import PageHeader from '~/components/PageHeader';
import TeamMemberCard from '~/components/TeamMemberCard';
import { useToast } from '~/contexts/ToastContext';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Team Details' }];
}

export async function loader({ request }: Route.LoaderArgs) {
	const session = await request_session(request);
	return data({ user: session.get('user') });
}

async function remote_fetch_user_requests(token: string) {
	const url = new URL(
		'/api/users/me/requests',
		import.meta.env.BROWSER_REST_USER_ORIGIN
	);
	const res = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');

	type JSONData_Requests = {
		data: string[];
	};
	return (json as JSONData_Requests).data;
}

async function remote_request_team_join(token: string, team_name: string) {
	const url = new URL(
		`/api/teams/${team_name}/requests`,
		import.meta.env.BROWSER_REST_USER_ORIGIN
	);
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
}

async function remote_request_team_cancel(token: string, team_name: string) {
	const url = new URL(
		`/api/teams/${team_name}/requests`,
		import.meta.env.BROWSER_REST_USER_ORIGIN
	);
	const res = await fetch(url, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
}

type RequestPayload<T> = {
	token?: string | null;
	team_name?: string | null;
} & T;

export default function Page({ loaderData, params }: Route.ComponentProps) {
	const session_user = loaderData.user;
	const team_name = params.id;

	const { addToast } = useToast();
	const queryClient = useQueryClient();

	const query_user = useQuery({
		queryKey: [
			'user',
			{ username: session_user?.username },
			{ token_access: session_user?.token_access },
		],
		initialData: null,
		queryFn: async () => {
			if (!session_user) return null;
			return await fetch_user(session_user.token_access);
		},
	});
	const user = query_user.data;

	const query_details = useQuery({
		queryKey: ['team', { team_name }],
		initialData: null,
		queryFn: async () => {
			if (!team_name) return null;
			return await remote_fetch_details(team_name);
		},
	});
	const details = query_details.data;

	const query_members = useQuery({
		queryKey: ['team-members', { team_name }],
		initialData: [],
		queryFn: async () => {
			if (!team_name) return [];
			const data = await remote_fetch_members(team_name);
			return data?.members ?? [];
		},
	});
	const members = query_members.data;

	const query_user_requests = useQuery({
		queryKey: ['user-requests', { username: session_user?.username }],
		initialData: [],
		queryFn: async () => {
			if (!session_user?.token_access) return [];
			return await remote_fetch_user_requests(session_user.token_access);
		},
	});
	const teams_requested = query_user_requests.data;

	const is_locked = details?.is_locked ?? false;
	const has_requested = team_name ? teams_requested.includes(team_name) : false;
	const is_member = Boolean(user?.team_name) && user?.team_name === team_name;
	const has_team = Boolean(user?.team_name);

	const mut_request_join = useMutation<
		unknown,
		Error,
		RequestPayload<{ team_name: string }>
	>({
		async mutationFn({ token, team_name }) {
			if (!token) throw new Error('Unauthorized');
			if (!team_name) throw new Error('Missing team name');
			await remote_request_team_join(token, team_name);
		},
		async onSuccess() {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['user-requests'] }),
				queryClient.invalidateQueries({ queryKey: ['teams'] }),
			]);
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
		},
	});
	const handleRequestJoin = () =>
		mut_request_join.mutate({ token: session_user?.token_access, team_name });

	const mut_request_cancel = useMutation<
		unknown,
		Error,
		RequestPayload<{ team_name: string }>
	>({
		async mutationFn({ token, team_name }) {
			if (!token) throw new Error('Unauthorized');
			if (!team_name) throw new Error('Missing team name');
			await remote_request_team_cancel(token, team_name);
		},
		async onSuccess() {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['user-requests'] }),
				queryClient.invalidateQueries({ queryKey: ['teams'] }),
			]);
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
		},
	});
	const handleCancelRequest = () =>
		mut_request_cancel.mutate({ token: session_user?.token_access, team_name });

	const action_pending =
		mut_request_join.isPending || mut_request_cancel.isPending;

	const renderAction = () => {
		if (is_member) return null;

		if (!session_user) {
			return (
				<Button
					variant="ghost"
					disabled
					aria-label="Sign in to request joining this team"
				>
					Sign in to Join
				</Button>
			);
		}
		if (has_requested) {
			return (
				<Button
					variant="secondary"
					onClick={handleCancelRequest}
					disabled={action_pending}
					aria-label={`Cancel request to join ${details?.name ?? team_name}`}
				>
					Cancel Request
				</Button>
			);
		}
		if (is_locked) {
			return (
				<Button
					variant="ghost"
					disabled
					aria-label="This team is closed for new members"
				>
					Closed
				</Button>
			);
		}
		if (has_team) {
			return (
				<Button
					variant="ghost"
					disabled
					aria-label="Leave your current team to join another"
				>
					Already in a Team
				</Button>
			);
		}
		return (
			<Button
				variant="primary"
				onClick={handleRequestJoin}
				disabled={action_pending}
				aria-label={`Request to join ${details?.name ?? team_name}`}
			>
				Request to Join
			</Button>
		);
	};

	return (
		<>
			<PageHeader
				title={details?.name ?? team_name ?? 'N/A'}
				action={renderAction()}
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
								{details?.description && (
									<p className="text-dark/80 mb-4">{details.description}</p>
								)}
								<div className="flex flex-wrap gap-4 text-sm">
									<InfoText icon="user" className="text-dark/60">
										Captain: {details?.captain_name ?? 'N/A'}
									</InfoText>
									<div
										className={`px-3 py-1 rounded-full text-sm font-semibold ${
											!is_locked
												? 'bg-green-100 text-green-700'
												: 'bg-gray-100 text-gray-700'
										}`}
										aria-label={
											!is_locked
												? 'Team is open for new members'
												: 'Team is closed for new members'
										}
									>
										{!is_locked ? 'Open' : 'Closed'}
									</div>
								</div>
							</div>
						</section>

						<section aria-labelledby="members-heading">
							<h2
								id="members-heading"
								className="text-2xl font-bold text-dark mb-4"
							>
								Members ({details?.members_count ?? members.length})
							</h2>
							<div
								className="space-y-4"
								role="list"
								aria-label="Team members list"
							>
								{members.map((member) => (
									<div key={member.username} role="listitem">
										<TeamMemberCard
											{...member}
											is_captain={member.username === details?.captain_name}
										/>
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
							<StatsCard iconName="trophy" label="Points Earned" value={0} />
							<StatsCard
								iconName="calendar"
								label="Event Participations"
								value={0}
							/>
							<StatsCard
								iconName="user"
								label="Members"
								value={`${details?.members_count ?? members.length}`}
							/>
						</div>
					</aside>
				</div>
			</main>
		</>
	);
}
