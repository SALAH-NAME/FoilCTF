import { data, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Route } from './+types/team';

import { fetch_user } from '~/routes/profile';
import { request_session } from '~/session.server';

import Modal from '~/components/Modal';
import Button from '~/components/Button';
import InfoText from '~/components/InfoText';
import StatsCard from '~/components/StatsCard';
import FormInput from '~/components/FormInput';
import FilterTabs from '~/components/FilterTabs';
import PageHeader from '~/components/PageHeader';
import TeamMemberCard from '~/components/TeamMemberCard';
import JoinRequestCard from '~/components/JoinRequestCard';
import { useToast } from '~/contexts/ToastContext';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - My Team' }];
}
export async function loader({ request }: Route.LoaderArgs) {
	const session = await request_session(request);

	const user = session.get('user');
	return data({ user });
}

type RequestPayload<T> = {
	token?: string | null;
	team_name?: string | null;
} & T;

export async function remote_fetch_members(team: string) {
	const uri = new URL(`/api/teams/${team}/members`, import.meta.env.VITE_REST_USER_ORIGIN);
	const res = await fetch(uri);

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok)
		throw new Error(json.error ?? 'Internal server error');

	type JSONData_Member = {
		id: number | null;
		username: string;
		avatar: string | null;
		total_points: number | null;
		challenges_solved: number | null;
	};
	return json as { members: JSONData_Member[] };
}
export async function remote_fetch_details(team: string) {
	const uri = new URL(`/api/teams/${team}`, import.meta.env.VITE_REST_USER_ORIGIN);
	const res = await fetch(uri);

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok)
		throw new Error(json.error ?? 'Internal server error');

	type JSONData_Details = {
		name: string;
		is_locked: boolean | null;
		description: string | null;

		captain_name: string;
		members_count: number;
	};
	return json as JSONData_Details;
}
export async function remote_fetch_requests(token: string, team: string) {
	const uri = new URL(`/api/teams/${team}/requests`, import.meta.env.VITE_REST_USER_ORIGIN);
	const res = await fetch(uri, {
		headers: {
			'Authorization': `Bearer ${token}`,
		}
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok)
		throw new Error(json.error ?? 'Internal server error');
	type JSONData_Requests = {
		data: string[];
		page: number;
		limit: number;
	};
	return json as JSONData_Requests;
}
export async function remote_update_team(token: string, payload: any) {
	const uri = new URL(`/api/teams`, import.meta.env.VITE_REST_USER_ORIGIN);
	const res = await fetch(uri, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`,
		},
		body: JSON.stringify(payload),
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Invalid response format');

	const json = await res.json();
	if (!res.ok)
		throw new Error(json.error ?? 'Internal server error');
}
export async function remote_update_team_request(token: string, team_name: string, username: string, method: 'PUT' | 'DELETE') {
	const uri = new URL(`/api/teams/${team_name}/requests/${username}`, import.meta.env.VITE_REST_USER_ORIGIN);
	const res = await fetch(uri, {
		method,
		headers: {
			'Authorization': `Bearer ${token}`,
		},
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Invalid response format');

	const json = await res.json();
	if (!res.ok)
		throw new Error(json.error ?? 'Internal server error');
}
export async function remote_update_team_member_kick(token: string, team_name: string, username: string) {
	const uri = new URL(`/api/teams/${team_name}/members/${username}`, import.meta.env.VITE_REST_USER_ORIGIN);
	const res = await fetch(uri, {
		method: 'DELETE',
		headers: {
			'Authorization': `Bearer ${token}`,
		},
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Invalid response format');

	const json = await res.json();
	if (!res.ok)
		throw new Error(json.error ?? 'Internal server error');
}
export async function remote_update_team_member_crown(token: string, team_name: string, username: string) {
	const uri = new URL(`/api/teams/${team_name}/crown`, import.meta.env.VITE_REST_USER_ORIGIN);
	const res = await fetch(uri, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`,
		},
		body: JSON.stringify({ username }),
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Invalid response format');

	const json = await res.json();
	if (!res.ok)
		throw new Error(json.error ?? 'Internal server error');
}
export async function remote_update_team_member_leave(token: string, team_name: string) {
	const uri = new URL(`/api/teams/${team_name}/members/me`, import.meta.env.VITE_REST_USER_ORIGIN);
	const res = await fetch(uri, {
		method: 'DELETE',
		headers: {
			'Authorization': `Bearer ${token}`,
		}
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Invalid response format');

	const json = await res.json();
	if (!res.ok)
		throw new Error(json.error ?? 'Internal server error');
}
export async function remote_delete_team(token: string, team_name: string) {
	const uri = new URL(`/api/teams/${team_name}`, import.meta.env.VITE_REST_USER_ORIGIN);
	const res = await fetch(uri, {
		method: 'DELETE',
		headers: {
			'Authorization': `Bearer ${token}`,
		}
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Invalid response format');

	const json = await res.json();
	if (!res.ok)
		throw new Error(json.error ?? 'Internal server error');
}
export default function Page({ loaderData }: Route.ComponentProps) {
	const session_user = loaderData.user;
	const navigate = useNavigate();

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

	const query_members = useQuery({
		queryKey: [
			'team-members',
			{ team_name: user?.team_name ?? null },
			{ token_access: session_user?.token_access },
		],
		initialData: [],
		queryFn: async () => {
			if (!session_user || !user?.team_name)
				return [];
			const data = await remote_fetch_members(user.team_name);
			return data?.members ?? [];
		},
	});
	const members = query_members.data;

	const query_details = useQuery({
		queryKey: [
			'team',
			{ team_name: user?.team_name ?? null },
			{ token_access: session_user?.token_access },
		],
		initialData: null,
		queryFn: async () => {
			if (!session_user || !user?.team_name)
				return null;
			return await remote_fetch_details(user.team_name);
		},
	});
	const details = query_details.data;

	const query_requests = useQuery({
		queryKey: [
			'team-requests',
			{ team_name: user?.team_name ?? null },
			{ token_access: session_user?.token_access },
		],
		initialData: [],
		queryFn: async () => {
			if (!session_user?.token_access || !user?.team_name)
				return [];
			const { data: requests } = await remote_fetch_requests(session_user?.token_access, user?.team_name);
			return requests;
		},
	});
	const requests = query_requests.data;

	const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members');
	const [showSettings, setShowSettings] = useState(false);
	const [showLeaveModal, setShowLeaveModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const [editSettings, setEditSettings] = useState({ description: '', is_locked: false });
	const toggleEditSettingsIsLocked = () => {
		setEditSettings(value => ({ ...value, is_locked: !value.is_locked }));
	};
	const setEditSettingsIsLocked = (is_locked: boolean) => {
		setEditSettings(value => ({ ...value, is_locked }));
	};
	const setEditSettingsDescription = (description: string) => {
		setEditSettings(value => ({ ...value, description }));
	};
	useEffect(() => {
		if (!details)
			return ;
		setEditSettings(value => ({ ...value, is_locked: details.is_locked ?? false, description: details.description ?? '' }));
	}, [details?.is_locked, details?.description]);

	const { addToast } = useToast();

	type TeamPayload = { is_locked?: boolean; description?: string; };

	const queryClient = useQueryClient();
	const mut_team_update = useMutation<unknown, Error, { token?: string | null; team_name?: string | null; payload: Partial<TeamPayload> }>({
		mutationFn: async ({ payload, token, team_name }) => {
			if (!token)
				throw new Error('Unauthorized');
			if (Object.keys(payload).length === 0)
				return ;

			await remote_update_team(token, payload);
			await queryClient.invalidateQueries({ queryKey: ['team', { team_name }] });
		},
		async onSuccess() {
			setShowSettings(false);
			addToast({
				variant: 'success',
				title: 'Team settings',
				message: 'Updated successfully',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Team settings',
				message: err.message,
			});
		},
	});
	const onSubmitEditSettings = () => {
		const payload: Partial<TeamPayload> = { };
		if (editSettings.description !== query_details.data?.description)
			payload.description = editSettings.description;
		if (editSettings.is_locked !== query_details.data?.is_locked)
			payload.is_locked = editSettings.is_locked;
		mut_team_update.mutate({ team_name: user?.team_name, token: session_user?.token_access, payload });
	};

	const mut_team_request_accept = useMutation<unknown, Error, RequestPayload<{ username: string; }>>({
		mutationFn: async ({ token, team_name, username}) => {
			if (!token)
				throw new Error('Unauthorized');
			if (!team_name)
				throw new Error('Missing team name');
			await remote_update_team_request(token, team_name, username, 'PUT');
		},
		async onSuccess() {
			await queryClient.invalidateQueries({ queryKey: ['team-requests', { team_name: user?.team_name ?? null }] });
			await queryClient.invalidateQueries({ queryKey: ['team-members', { team_name: user?.team_name ?? null }] });
			setShowSettings(false);
			addToast({
				variant: 'success',
				title: 'Team request accepted',
				message: 'Member is now part of your team',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Team request',
				message: err.message,
			});
		},
	});
	const handleAcceptRequest = (username: string) => mut_team_request_accept.mutate({ token: session_user?.token_access, team_name: user?.team_name, username });

	const mut_team_request_reject = useMutation<unknown, Error, RequestPayload<{ username: string }>>({
		mutationFn: async ({ token, team_name, username}) => {
			if (!token)
				throw new Error('Unauthorized');
			if (!team_name)
				throw new Error('Missing team name');
			await remote_update_team_request(token, team_name, username, 'DELETE');
		},
		async onSuccess() {
			await queryClient.invalidateQueries({ queryKey: ['team-requests', { team_name: user?.team_name ?? null }] });
			setShowSettings(false);
			addToast({
				variant: 'success',
				title: 'Team request refused',
				message: 'Request has been dismissed',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Team request',
				message: err.message,
			});
		},
	});
	const handleRejectRequest = (username: string) => mut_team_request_reject.mutate({ token: session_user?.token_access, team_name: user?.team_name, username });

	const mut_team_member_kick = useMutation<unknown, Error, RequestPayload<{ username: string }>>({
		mutationFn: async ({ token, team_name, username}) => {
			if (!token)
				throw new Error('Unauthorized');
			if (!team_name)
				throw new Error('Missing team name');
			await remote_update_team_member_kick(token, team_name, username);
		},
		async onSuccess() {
			await queryClient.invalidateQueries({ queryKey: ['team-members', { team_name: user?.team_name ?? null }] });
			await queryClient.invalidateQueries({ queryKey: ['team', { team_name: user?.team_name ?? null }] });
			setShowSettings(false);
			addToast({
				variant: 'success',
				title: 'Team member left',
				message: 'Member has been kicked from the team',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Team member',
				message: err.message,
			});
		},
	});
	const handleKickMember = (username: string) => mut_team_member_kick.mutate({ username, team_name: user?.team_name, token: session_user?.token_access });

	const mut_team_member_crown = useMutation<unknown, Error, RequestPayload<{ username: string }>>({
		mutationFn: async ({ token, team_name, username}) => {
			if (!token)
				throw new Error('Unauthorized');
			if (!team_name)
				throw new Error('Missing team name');
			await remote_update_team_member_crown(token, team_name, username);
		},
		async onSuccess() {
			await queryClient.invalidateQueries({ queryKey: ['team-members', { team_name: user?.team_name ?? null }] });
			await queryClient.invalidateQueries({ queryKey: ['team', { team_name: user?.team_name ?? null }] });
			setShowSettings(false);
			addToast({
				variant: 'success',
				title: 'Captain crowned',
				message: 'Captaincy has been transferred to another member',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Team request',
				message: err.message,
			});
		},
	});
	const handleMakeCaptain = (username: string) => mut_team_member_crown.mutate({ token: session_user?.token_access, team_name: user?.team_name, username });

	const mut_team_member_leave = useMutation<unknown, Error, RequestPayload<unknown>>({
		mutationFn: async ({ token, team_name }) => {
			if (!token)
				throw new Error('Unauthorized');
			if (!team_name)
				throw new Error('Missing team name');
			await remote_update_team_member_leave(token, team_name);
		},
		onMutate: () => {
			setShowLeaveModal(false);
		},
		async onSuccess() {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['team-members', { team_name: user?.team_name ?? null }] }),
				queryClient.invalidateQueries({ queryKey: ['teams', { team_name: user?.team_name ?? null }] }),
			]);

			setShowSettings(false);
			addToast({
				variant: 'success',
				title: 'Team membership',
				message: 'You have left the team',
			});

			await navigate('/teams');
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Team membership',
				message: err.message,
			});
		},
	});
	const handleLeaveTeam = () => mut_team_member_leave.mutate({ token: session_user?.token_access, team_name: user?.team_name });

	const mut_team_delete = useMutation<unknown, Error, RequestPayload<unknown>>({
		mutationFn: async ({ token, team_name }) => {
			if (!token)
				throw new Error('Unauthorized');
			if (!team_name)
				throw new Error('Missing team name');
			await remote_delete_team(token, team_name);
		},
		onMutate: () => {
			setShowDeleteModal(false);
		},
		async onSuccess() {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['team-members', { team_name: user?.team_name ?? null }] }),
				queryClient.invalidateQueries({ queryKey: ['teams', { team_name: user?.team_name ?? null }] }),
			]);
			setShowSettings(false);
			addToast({
				variant: 'success',
				title: 'Team Deletion',
				message: 'Team has been deleted successfully',
			});
			await navigate('/teams');
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Team deletion',
				message: err.message,
			});
		},
	});
	const handleDeleteTeam = () => mut_team_delete.mutate({ token: session_user?.token_access, team_name: user?.team_name });

	const disabled = mut_team_update.isPending;
	const is_captain = details?.captain_name === session_user?.username;

	const tabs = [{
		id: 'members',
		value: 'members',
		label: 'Members',
		count: members.length,
	}];
	if (is_captain)
		tabs.push({
			id: 'requests',
			value: 'requests',
			label: 'Join Requests',
			count: requests.length,
		});
	return (
		<>
			<PageHeader
				title={details?.name ?? "N/A"}
				action={
					<div className="flex gap-3">
						{is_captain && (
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
										{details?.members_count ?? 'N/A'} Members
									</InfoText>
									<div
										className={`px-3 py-1 rounded-full text-sm font-semibold ${
											!details?.is_locked
												? 'bg-green-100 text-green-700'
												: 'bg-gray-100 text-gray-700'
										}`}
										aria-label={
											!details?.is_locked
												? 'Team is open for new members'
												: 'Team is closed for new members'
										}
									>
										{!details?.is_locked ? 'Open' : 'Closed'}
									</div>
								</div>
							</div>
							{details?.description && (
								<p className="text-dark/80">{details?.description}</p>
							)}
						</section>

						{is_captain && (
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
									{members.map((member) => (
										<div key={member.username} role="listitem">
											<TeamMemberCard
												{...member}
												is_captain={member.username === details?.captain_name}
												is_editable={session_user?.username === details?.captain_name}
												onMakeCaptain={() => handleMakeCaptain(member.username)}
												onKick={() => handleKickMember(member.username)}
											/>
										</div>
									))}
								</div>
							</section>
						)}

						{is_captain && activeTab === 'requests' && (
							<section aria-labelledby="requests-heading">
								<h2
									id="requests-heading"
									className="text-2xl font-bold text-dark mb-4"
								>Join Requests</h2>
								{requests.length === 0 ? (
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
										{requests.map((username) => (
											<div key={username} role="listitem">
												<JoinRequestCard
													username={username}
													onAccept={() => handleAcceptRequest(username)}
													onReject={() => handleRejectRequest(username)}
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
								label="Points Earned"
								value={0}
							/>
							<StatsCard
								iconName="calendar"
								label="Event Participations"
								value={0}
							/>
							<StatsCard
								iconName="user"
								label="Members"
								value={`${details?.members_count ?? 'N/A'}`}
							/>
						</div>
					</aside>
				</div>
			</main>

			<Modal
				isOpen={showSettings}
				onClose={() => {
					setShowSettings(false);
					setEditSettingsIsLocked(details?.is_locked ?? false);
					setEditSettingsDescription(details?.description ?? '');
				}}
				title="Team Settings"
				footer={
					<div className="flex gap-3 justify-end">
						<Button
							variant="ghost"
							onClick={() => {
								setShowSettings(false);
								setEditSettingsIsLocked(details?.is_locked ?? false);
								setEditSettingsDescription(details?.description ?? '');
							}}
							disabled={disabled}
						>
							Cancel
						</Button>
						<Button variant="primary" onClick={onSubmitEditSettings} disabled={disabled}>
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
						value={editSettings.description}
						onChange={(e) => setEditSettingsDescription(e.target.value)}
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
								onClick={toggleEditSettingsIsLocked}
								aria-checked={!editSettings.is_locked}
								className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
									!editSettings.is_locked ? 'bg-primary' : 'bg-dark/20'
								}`}
								aria-label="Toggle team openness"
							>
								<span className="sr-only">Open for new members to join</span>
								<span
									className={`absolute h-4 w-4 transform rounded-full bg-white transition-transform ${
										!editSettings.is_locked ? 'translate-x-3' : '-translate-x-3'
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
				onClose={() => { if (disabled) return ; setShowLeaveModal(false) }}
				title="Leave Team"
				size="sm"
				footer={
					<div className="flex gap-3 justify-end">
						<Button variant="ghost" onClick={() => setShowLeaveModal(false)}>
							Cancel
						</Button>
						{!is_captain && (
							<Button variant="danger" onClick={handleLeaveTeam}>
								Leave Team
							</Button>
						)}
					</div>
				}
			>
				{is_captain ? (
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
						<span className="font-semibold">{details?.name ?? 'N/A'}</span>?
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
						<span className="font-semibold">{details?.name ?? 'N/A'}</span>?
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
