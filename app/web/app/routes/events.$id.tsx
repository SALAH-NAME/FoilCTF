import { useEffect, useState } from 'react';
import { data, Link, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useToast } from '~/contexts/ToastContext';
import { request_session_user, type SessionUser } from '~/session.server';

import type { Route } from './+types/events.$id';

import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import InfoText from '~/components/InfoText';
import BackLink from '~/components/BackLink';
import PageHeader from '~/components/PageHeader';
import PageSection from '~/components/PageSection';
import SearchInput from '~/components/SearchInput';
import CountdownCard from '~/components/CountdownCard';
import EventStatCard from '~/components/EventStatCard';
import AdminEventModal from '~/components/AdminEventModal';
import { remote_fetch_challenges } from './challenges';
import { remote_update_event } from '~/components/EventForm';

export function meta({ params }: Route.MetaArgs) {
	return [
		{ title: `Event ${params.id} - FoilCTF` },
		{ name: 'description', content: `Details for event ${params.id}` },
	];
}
export async function loader({ request }: Route.LoaderArgs) {
	const user = await request_session_user(request);
	return data({ user });
}

export async function remote_fetch_event(id: string, token?: string) {
	const url = new URL(
		`/api/events/${id}`,
		import.meta.env.BROWSER_REST_EVENTS_ORIGIN
	);
	const headers = new Headers();
	if (token) headers.set('Authorization', `Bearer ${token}`);
	const res = await fetch(url, { headers });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');

	type JSONData_Event = {
		event: {
			name: string;
			description: string;
			team_members_min: number;
			team_members_max: number;
			metadata: Record<string, any>;
			start_time: string;
			end_time: string;
			status: 'draft' | 'published' | 'active' | 'ended';
			participation_count: number;
			challenge_count: number;
			max_teams: number | null;
		};
		organizers: { username: string; avatar: string }[];
		user_status: {
			is_organizer: boolean;
			is_guest: boolean;
			is_joined: boolean;
		};
	};
	return json as JSONData_Event;
}
export async function remote_fetch_team(token: string) {
	const url = new URL(
		`/api/teams/me`,
		import.meta.env.BROWSER_REST_USER_ORIGIN
	);
	const headers = new Headers({ Authorization: `Bearer ${token}` });
	const res = await fetch(url, { headers });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');

	type JSONData_Team = {
		id: number;
		name: string;
		captain_name: string;
		members_count: number;
		description: string | null;
		is_locked: boolean | null;
		profile_id: number | null;
	};
	return json as JSONData_Team;
}
export async function remote_join_event(token: string, id: string | number) {
	const url = new URL(
		`/api/events/${id}/join`,
		import.meta.env.BROWSER_REST_EVENTS_ORIGIN
	);
	const method = 'POST';
	const headers = new Headers({ Authorization: `Bearer ${token}` });
	const res = await fetch(url, { method, headers });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');

	type JSONData_Join = {
		ok: true;
	};
	return json as JSONData_Join;
}
export async function remote_leave_event(token: string, id: string | number) {
	const url = new URL(
		`/api/events/${id}/leave`,
		import.meta.env.BROWSER_REST_EVENTS_ORIGIN
	);
	const method = 'DELETE';
	const headers = new Headers({ Authorization: `Bearer ${token}` });
	const res = await fetch(url, { method, headers });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');

	type JSONData_Leave = {
		ok: true;
	};
	return json as JSONData_Leave;
}
export async function remote_delete_event(token: string, id: string | number) {
	const url = new URL(
		`/api/admin/events/${id}`,
		import.meta.env.BROWSER_REST_EVENTS_ORIGIN
	);
	const method = 'DELETE';
	const headers = new Headers({ Authorization: `Bearer ${token}` });
	const res = await fetch(url, { method, headers });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');

	type JSONData_Delete = {
		ok: true;
	};
	return json as JSONData_Delete;
}
export default function Page({ params, loaderData }: Route.ComponentProps) {
	const { user } = loaderData;

	const navigate = useNavigate();
	const { addToast } = useToast();

	const [show_modal_edit, setShowModalEdit] = useState(false);
	const [show_modal_delete, setShowModalDelete] = useState(false);
	const [show_modal_unregister, setShowModalUnregister] = useState(false);
	const [show_modal_challenges, setShowModalChallenges] = useState(false);

	const queryClient = useQueryClient();

	const query_event = useQuery({
		queryKey: [
			'event',
			{
				event_id: params.id,
				username: user?.username,
				token: user?.token_access,
			},
		],
		initialData: null,
		async queryFn() {
			return await remote_fetch_event(params.id, user?.token_access);
		},
	});
	const query_team = useQuery({
		queryKey: ['team', { token: user?.token_access, username: user?.username }],
		initialData: null,
		async queryFn() {
			const token = user?.token_access;
			if (!token) return null;

			return await remote_fetch_team(token);
		},
	});

	const data_team = query_team.data;
	const data_event = query_event.data;

	type MutationPayload<T> = {
		token?: string | null;
		role?: 'admin' | 'user';
	} & T;
	const mut_join = useMutation<
		unknown,
		Error,
		MutationPayload<{ event_id?: string | number }>
	>({
		async mutationFn({ token, event_id }) {
			if (!token) throw new Error('Unauthorized');
			if (!event_id) throw new Error('Event not found');
			await remote_join_event(token, event_id);
		},
		async onSuccess() {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['event'] }),
			]);
			addToast({
				variant: 'success',
				title: 'Team registered',
				message: 'Your team has been registered succesfully',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Event registration',
				message: err.message,
			});
		},
	});
	const mut_leave = useMutation<
		unknown,
		Error,
		MutationPayload<{ event_id?: string | number }>
	>({
		async mutationFn({ token, event_id }) {
			if (!token) throw new Error('Unauthorized');
			if (!event_id) throw new Error('Event not found');
			await remote_leave_event(token, event_id);
		},
		async onSuccess() {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['event'] }),
			]);

			addToast({
				variant: 'success',
				title: 'Team left the event',
				message: 'Your team is no longer participating in the event',
			});
			setShowModalUnregister(false);
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Team unregistration',
				message: err.message,
			});
		},
	});
	const mut_delete = useMutation<
		unknown,
		Error,
		MutationPayload<{ event_id?: string | number }>
	>({
		async mutationFn({ token, role, event_id }) {
			if (!token || role !== 'admin') throw new Error('Unauthorized');
			if (!event_id) throw new Error('Event not found');
			await remote_delete_event(token, event_id);
		},
		async onSuccess() {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['events'] }),
			]);

			addToast({
				variant: 'success',
				title: 'Event deleted',
				message: 'Event has been deleted successfully',
			});
			await navigate('/events');
			// setShowModalUnregister(false);
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Event deletion',
				message: err.message,
			});
		},
	});

	const is_registered = Boolean(
		user && data_event && data_event.user_status.is_joined
	);
	const can_show_play = Boolean(
		is_registered && data_event?.event.status === 'active'
	);
	const can_show_registration = Boolean(
		user &&
		data_event &&
		data_event?.event.status === 'published' &&
		data_team?.captain_name === user.username
	);
	const organizer =
		data_event?.organizers
			.map((x) => x.username)
			.filter((x) => !!x)
			.join(', ') || 'FoilCTF';

	const disabled =
		query_event.isPending ||
		mut_join.isPending ||
		mut_leave.isPending ||
		mut_delete.isPending;

	const handleCancelUnregister = () => setShowModalUnregister(false);
	const handleConfirmUnregister = () => {
		const role = user?.role;
		const token = user?.token_access;
		const event_id = params.id;
		mut_leave.mutate({ token, role, event_id });
	};

	const handleRegister = () => {
		const role = user?.role;
		const token = user?.token_access;
		const event_id = params.id;
		mut_join.mutate({ token, role, event_id });
	};
	const handleUnregister = () => setShowModalUnregister(true);

	const handleCloseDelete = () => setShowModalDelete(false);
	const handleSubmitDelete = () => {
		const role = user?.role;
		const token = user?.token_access;
		const event_id = params.id;
		mut_delete.mutate({ token, role, event_id });
	};

	const formatDate = (date_string?: string) => {
		if (!date_string) return 'N/A';
		const intl = new Intl.DateTimeFormat('en-MA', {
			dateStyle: 'long',
			timeStyle: 'short',
			hour12: false,
		});
		return intl.format(new Date(date_string));
	};
	const getStatusColor = (status?: string) => {
		switch (status) {
			case 'active':
				return 'text-green-600';
			case 'published':
				return 'text-primary';
			case 'draft':
			case 'ended':
				return 'text-muted';
			default:
				return 'text-foreground';
		}
	};
	const formatDuration = (start_time?: string, end_time?: string) => {
		if (!start_time || !end_time) return 'N/A';
		const start_date = new Date(start_time);
		const end_date = new Date(end_time);

		const diff = end_date.getTime() - start_date.getTime();
		return Math.ceil(diff / (1000 * 60 * 60 * 24));
	};

	useEffect(() => {
		const { id } = params;
		const number = Number(id);
		if (!isFinite(number) || number < 0 || number.toFixed(0) !== id) {
			addToast({
				variant: 'error',

				title: 'Events',
				message: 'Invalid ID',
			});
			navigate('/events');
		}
	}, [params.id]);
	if (query_event.isError) {
		return (
			<div className="flex flex-col gap-4">
				<BackLink to="/events">Events</BackLink>
				<div className="flex flex-col items-center justify-center py-24 text-center gap-4">
					<p
						className="text-8xl font-bold text-primary/50 leading-none select-none"
						aria-hidden="true"
					>
						404
					</p>
					<h1 className="text-3xl font-bold text-dark">Event not found</h1>
					<p className="text-dark/70">
						The event you're looking for doesn't exist or has been removed.
					</p>
					<Link
						to="/events"
						className="mt-2 px-6 py-2 border-2 border-dark font-semibold rounded hover:bg-primary hover:text-white transition-colors"
					>
						Back to Events
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<BackLink to="/events">Events</BackLink>

			<PageHeader
				title={data_event?.event.name ?? 'N/A'}
				className="mb-4"
				action={
					Boolean(data_event) &&
					user?.role === 'admin' && (
						<div className="inline-flex gap-4 items-center">
							<Button
								disabled={disabled}
								variant="danger"
								size="sm"
								onClick={() => setShowModalDelete(true)}
								aria-label="Delete this event"
							>
								<Icon name="trash" className="size-4" aria-hidden={true} />
								Delete
							</Button>
							<Button
								disabled={disabled}
								variant="ghost"
								size="sm"
								onClick={() => setShowModalEdit(true)}
								aria-label="Edit this event"
							>
								<Icon name="edit" className="size-4" aria-hidden={true} />
								Edit
							</Button>
							<Button
								disabled={disabled}
								variant="ghost"
								size="sm"
								onClick={() => setShowModalChallenges(true)}
								aria-label="Edit this event"
							>
								<Icon name="challenge" className="size-4" aria-hidden={true} />
								Manage
							</Button>
						</div>
					)
				}
			/>

			<section aria-labelledby="event-title ">
				<div className="bg-surface border border-neutral-300 rounded-md overflow-hidden">
					<div className="bg-linear-to-r from-primary to-secondary gap-4 p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between">
						<div className="max-w-4xl">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
								<h1
									id="event-title"
									className="text-2xl md:text-3xl lg:text-4xl font-bold text-white"
								>
									{data_event?.event.name}
								</h1>
							</div>

							<div className="flex flex-col sm:flex-row sm:items-center gap-4 p-2 w-fit">
								<InfoText
									icon="user"
									className="text-white font-bold"
									iconClassName="w-5 h-5"
								>
									Organized by {organizer}
								</InfoText>
							</div>
						</div>

						{can_show_play && (
							<Link
								to="play"
								className="flex items-center no-underline text-xl text-dark bg-white hover:bg-white/80 rounded-md p-2 px-16 h-fit font-bold transition-colors w-fit"
							>
								Play
							</Link>
						)}
					</div>

					<div className="p-6 md:p-8">
						{can_show_registration && (
							<div
								className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-md"
								role="status"
								aria-live="polite"
							>
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
									<div className="flex-1">
										<h2 className="text-lg font-semibold text-foreground mb-1">
											Registration Status
										</h2>
										<p className="text-muted text-sm">
											{is_registered
												? 'You are registered for this event'
												: 'Join the competition and compete with teams worldwide'}
										</p>
									</div>
									<Button
										disabled={disabled}
										variant={is_registered ? 'danger' : 'primary'}
										onClick={is_registered ? handleUnregister : handleRegister}
										aria-label={
											is_registered
												? 'Unregister from this event'
												: 'Register for this event'
										}
									>
										{is_registered ? (
											<>
												<Icon name="close" className="w-4 h-4" />
												Unregister
											</>
										) : (
											<>
												<Icon name="add" className="w-4 h-4" />
												Register Now
											</>
										)}
									</Button>
								</div>
							</div>
						)}

						{data_event?.event.status === 'published' && (
							<div className="mb-6">
								<CountdownCard
									status={data_event?.event.status}
									variant="upcoming"
									targetDate={data_event?.event.start_time}
								/>
							</div>
						)}

						{data_event?.event.status === 'active' && (
							<div className="mb-6">
								<CountdownCard
									status={data_event?.event.status}
									variant="active"
									targetDate={data_event?.event.end_time}
								/>
							</div>
						)}

						<div
							className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
							role="region"
							aria-label="Event Statistics"
						>
							<EventStatCard
								icon="calendar"
								label="Start Date"
								value={formatDate(data_event?.event.start_time)}
							/>

							<EventStatCard
								icon="calendar"
								label="End Date"
								value={formatDate(data_event?.event.end_time)}
							/>

							<EventStatCard
								icon="user"
								label="Teams Registered"
								value={`${data_event?.event.participation_count ?? 0} / ${data_event?.event.max_teams ?? 0}`}
							/>

							<EventStatCard
								icon="chart"
								label="Registration"
								value={
									data_event?.event.status === 'published' ? 'Open' : 'Closed'
								}
							/>
						</div>
					</div>
				</div>
			</section>

			{data_event?.event.description && (
				<PageSection>
					<div role="region" aria-labelledby="about-heading">
						<h2
							id="about-heading"
							className="text-xl md:text-2xl font-semibold text-foreground mb-4"
						>
							About This Event
						</h2>
						<div className="prose prose-sm md:prose-base max-w-none">
							<p className="text-muted leading-relaxed">
								{data_event.event.description}
							</p>
						</div>
					</div>
				</PageSection>
			)}

			<PageSection>
				<div role="region" aria-labelledby="details-heading">
					<h2
						id="details-heading"
						className="text-xl md:text-2xl font-semibold text-foreground mb-6"
					>
						Event Details
					</h2>
					<dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="flex flex-col gap-2">
							<dt className="text-sm font-medium text-muted">Status</dt>
							<dd
								className={`text-lg font-semibold ${getStatusColor(data_event?.event.status)}`}
							>
								{(data_event?.event.status.charAt(0).toUpperCase() ?? '') +
									(data_event?.event.status.slice(1) ?? '')}
							</dd>
						</div>
						<div className="flex flex-col gap-2">
							<dt className="text-sm font-medium text-muted">Duration</dt>
							<dd className="text-lg font-semibold text-foreground">
								<span>
									{formatDuration(
										data_event?.event.start_time,
										data_event?.event.end_time
									)}
								</span>
								<span>
									{' '}
									day
									{formatDuration(
										data_event?.event.start_time,
										data_event?.event.end_time
									) === 1 && 's'}
								</span>
							</dd>
						</div>
						<div className="flex flex-col gap-2">
							<dt className="text-sm font-medium text-muted">Team Capacity</dt>
							<dd className="text-lg font-semibold text-foreground">
								{(data_event?.event.max_teams ?? 0) -
									(data_event?.event.participation_count ?? 0)}{' '}
								spots remaining
							</dd>
						</div>
						<div className="flex flex-col gap-2">
							<dt className="text-sm font-medium text-muted">Organizer</dt>
							<dd className="text-lg font-semibold text-foreground">
								{organizer}
							</dd>
						</div>
					</dl>
				</div>
			</PageSection>

			{data_event?.event.status !== 'published' && (
				<PageSection>
					<div
						className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
						role="region"
						aria-labelledby="leaderboard-heading"
					>
						<div className="flex-1">
							<h2
								id="leaderboard-heading"
								className="text-xl md:text-2xl font-semibold text-foreground mb-2"
							>
								Leaderboard
							</h2>
							<p className="text-muted">
								View rankings and scores for all participating teams
							</p>
						</div>
						<Link
							to={`/events/${params.id}/leaderboard`}
							className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md inline-block"
							aria-label="View event leaderboard"
						>
							<Button disabled={disabled} variant="primary">
								View Leaderboard
								<Icon name="chevronRight" className="w-4 h-4" />
							</Button>
						</Link>
					</div>
				</PageSection>
			)}

			<Modal
				isOpen={show_modal_unregister}
				onClose={handleCancelUnregister}
				title="Confirm Unregistration"
				size="sm"
				footer={
					<div className="flex gap-3 justify-end">
						<Button
							disabled={disabled}
							variant="secondary"
							onClick={handleCancelUnregister}
							type="button"
							aria-label="Cancel unregistration"
						>
							Cancel
						</Button>
						<Button
							disabled={disabled}
							variant="danger"
							onClick={handleConfirmUnregister}
							type="button"
							aria-label="Confirm unregistration from event"
						>
							Unregister
						</Button>
					</div>
				}
			>
				<div className="space-y-4">
					<p className="text-foreground">
						Are you sure you want to unregister from{' '}
						<strong className="font-semibold">
							{data_event?.event.name ?? 'N/A'}
						</strong>
						?
					</p>
					<div
						className="bg-amber-50 border border-amber-200 rounded-md p-4"
						role="alert"
					>
						<div className="flex gap-3">
							<Icon
								name="warning"
								className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
								aria-hidden={true}
							/>
							<div className="flex-1">
								<h3 className="font-semibold text-amber-900 mb-1">Warning</h3>
								<p className="text-sm text-amber-800">
									You will lose your current progress and may not be able to
									re-register if the event reaches maximum capacity.
								</p>
							</div>
						</div>
					</div>
				</div>
			</Modal>
			<Modal
				isOpen={show_modal_delete}
				onClose={handleCloseDelete}
				title="Confirm event deletion"
				size="sm"
				footer={
					<div className="flex gap-3 justify-end">
						<Button
							disabled={disabled}
							variant="ghost"
							onClick={handleCloseDelete}
							type="button"
							aria-label="Cancel"
						>
							Cancel
						</Button>
						<Button
							disabled={disabled}
							variant="danger"
							onClick={handleSubmitDelete}
							type="button"
							aria-label="Delete"
						>
							Delete
						</Button>
					</div>
				}
			>
				<div className="space-y-4">
					<p className="text-foreground">
						<span>Are you sure you want to delete event</span>
						<strong className="font-semibold">
							{' '}
							{data_event?.event.name ?? 'N/A'}
						</strong>
						?
					</p>
					<div
						className="bg-amber-50 border border-amber-200 rounded-md p-4"
						role="alert"
					>
						<div className="flex gap-3">
							<Icon
								name="warning"
								className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
								aria-hidden={true}
							/>
							<div className="flex-1">
								<h3 className="font-semibold text-amber-900 mb-1">Warning</h3>
								<p className="text-sm text-amber-800">
									Every associated piece of data will be lost, that is including
									participations, chatrooms, challenges, and more...
								</p>
							</div>
						</div>
					</div>
				</div>
			</Modal>

			<AdminEventModal
				user={user}
				event_id={params.id}
				isOpen={show_modal_edit}
				onClose={() => setShowModalEdit(false)}
			/>
			{data_event && user?.role === 'admin' && (
				<ChallengesModal
					user={user}
					event_id={params.id}
					show={show_modal_challenges}
					setShow={setShowModalChallenges}
					disabled={disabled}
				/>
			)}
		</div>
	);
}

type ChallengesModalProps = {
	user: SessionUser;
	show: boolean;
	event_id: string;
	setShow: (showValue: boolean) => void;
	disabled?: boolean;
};

export async function remote_fetch_event_challenges_admin(
	token: string,
	id: string
) {
	const uri = new URL(
		`/api/admin/events/${id}/challenges`,
		import.meta.env.BROWSER_REST_EVENTS_ORIGIN
	);
	const headers = new Headers({ Authorization: `Bearer ${token}` });
	const res = await fetch(uri, { headers });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');

	type JSONData_EventChallenges = {
		name: string;
		ctf_id: number;
		challenge_id: number;
		flag: { type: 'static'; content: string };
		reward: number;
		initial_reward: number;
		reward_first_blood: number;
		reward_decrements: boolean;
		reward_min: number;
		decay: number;
		attempts: number;
		solves: number;
		first_blood_at: string | null;
		first_blood_id: number | null;
		container_limits: Record<string, any>;
		released_at: string | null;
		requires_challenge_id: number | null;
		is_hidden: boolean | null;
	}[];
	return json as JSONData_EventChallenges;
}
export async function remote_unlink_event_challenges(
	token: string,
	event_id: string,
	challenge_id: number
) {
	const url = new URL(
		`/api/admin/events/${event_id}/challenges/${challenge_id}`,
		import.meta.env.BROWSER_REST_EVENTS_ORIGIN
	);
	const method = 'DELETE';
	const headers = new Headers({ Authorization: `Bearer ${token}` });
	const res = await fetch(url, { method, headers });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
}
export async function remote_link_event_challenges(
	token: string,
	event_id: string,
	challenge: object & { id: number }
) {
	const url = new URL(
		`/api/admin/events/${event_id}/challenges`,
		import.meta.env.BROWSER_REST_EVENTS_ORIGIN
	);
	const method = 'POST';
	const headers = new Headers({
		'Authorization': `Bearer ${token}`,
		'Content-Type': 'application/json',
	});
	const res = await fetch(url, {
		method,
		headers,
		body: JSON.stringify([
			{
				...challenge,
				challenge_id: challenge.id,
				ctf_id: Number(event_id),
				flag: {
					type: 'static',
					content: 'flag{' + (Math.random() * 1_000_000).toFixed(0) + '}',
				},
			},
		]),
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
}
export async function remote_update_event_challenges(
	token: string,
	event_id: string,
	challenge_id: number,
	payload: unknown
) {
	const url = new URL(
		`/api/admin/events/${event_id}/challenges/${challenge_id}`,
		import.meta.env.BROWSER_REST_EVENTS_ORIGIN
	);
	const method = 'PATCH';
	const headers = new Headers({
		'Authorization': `Bearer ${token}`,
		'Content-Type': 'application/json',
	});
	const res = await fetch(url, {
		method,
		headers,
		body: JSON.stringify(payload),
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
}
function ChallengesModal({
	show,
	setShow,
	user,
	event_id,
	disabled: disabled_sentinel,
}: ChallengesModalProps) {
	type Challenge = Awaited<
		ReturnType<typeof remote_fetch_challenges>
	>['challenges'][number];
	type ChallengeLink = Awaited<
		ReturnType<typeof remote_fetch_event_challenges_admin>
	>[number];

	const [input_search, set_input_search] = useState('');
	const [input_search_debounced, set_input_search_debounced] = useState('');
	useEffect(() => {
		const value = input_search;
		const timeout = setTimeout(() => {
			set_input_search_debounced(value);
		}, 300);
		return () => {
			clearTimeout(timeout);
		};
	}, [input_search]);

	const query_link = useQuery<unknown, Error, ChallengeLink[]>({
		queryKey: ['challenges-linked', { username: user.username }],
		initialData: [],
		async queryFn() {
			if (!user) return [];
			return await remote_fetch_event_challenges_admin(
				user.token_access,
				event_id.toString()
			);
		},
	});
	const items_link = query_link.data;

	const [drafts_link, set_drafts_link] = useState<ChallengeLink[]>([]);
	useEffect(() => {
		set_drafts_link(items_link);
	}, [items_link]);

	const query_search = useQuery<
		unknown,
		Error,
		{ challenges: Challenge[]; count: number }
	>({
		queryKey: [
			'challenges',
			{ username: user.username, searchQuery: input_search_debounced },
		],
		initialData: { challenges: [], count: 0 },
		async queryFn() {
			if (!user) return { challenges: [], count: 0 };
			return await remote_fetch_challenges(
				user.token_access,
				input_search_debounced,
				10,
				0,
				'published'
			);
		},
	});
	const { challenges: items_search_all } = query_search.data;
	const items_search = ((
		items_search: Challenge[],
		items_link: ChallengeLink[]
	) => {
		return items_search.filter((item) => {
			const index = items_link.findIndex((x) => item.id === x.challenge_id);
			return index === -1;
		});
	})(items_search_all, items_link);

	const { addToast } = useToast();
	const ref_query_client = useQueryClient();

	type MutationPayload<T> = {
		token?: string;
		event_id: string;
	} & T;
	const mut_link = useMutation<
		void,
		Error,
		MutationPayload<{ challenge: Challenge }>
	>({
		async mutationFn({ token, event_id, challenge }) {
			if (!token) throw new Error('Unauthorized');
			await remote_link_event_challenges(token, event_id, challenge);
		},
		async onSuccess() {
			await ref_query_client.invalidateQueries({
				queryKey: ['challenges-linked'],
			});
			await ref_query_client.invalidateQueries({ queryKey: ['challenges'] });
			addToast({
				variant: 'success',
				title: 'Challenge',
				message: 'Challenge has been added to the event',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Challenge',
				message: err.message,
			});
		},
	});
	const mut_unlink = useMutation<
		void,
		Error,
		MutationPayload<{ challenge: ChallengeLink }>
	>({
		async mutationFn({ token, event_id, challenge }) {
			if (!token) throw new Error('Unauthorized');
			await remote_unlink_event_challenges(
				token,
				event_id,
				challenge.challenge_id
			);
		},
		async onSuccess() {
			await ref_query_client.invalidateQueries({
				queryKey: ['challenges-linked'],
			});
			await ref_query_client.invalidateQueries({ queryKey: ['challenges'] });
			addToast({
				variant: 'success',
				title: 'Challenge',
				message: 'Challenge has been removed from the event',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Challenge',
				message: err.message,
			});
		},
	});
	const mut_update = useMutation<
		void,
		Error,
		MutationPayload<{ challenge_id: number; diff: object }>
	>({
		async mutationFn({ token, event_id, challenge_id, diff }) {
			if (!token) throw new Error('Unauthorized');
			await remote_update_event_challenges(token, event_id, challenge_id, diff);
		},
		async onSuccess() {
			await ref_query_client.invalidateQueries({
				queryKey: ['challenges-linked'],
			});
			addToast({
				variant: 'success',
				title: 'Challenge',
				message: 'Challenge has been updated successfully',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Challenge',
				message: err.message,
			});
		},
	});

	function onClickLink(challenge: Challenge) {
		mut_link.mutate({ token: user.token_access, event_id, challenge });
	}
	function onClickUnlink(challenge: ChallengeLink) {
		mut_unlink.mutate({ token: user.token_access, event_id, challenge });
	}
	function onChangeInput<K extends keyof ChallengeLink>(
		index: number,
		property: K,
		value: string
	) {
		switch (property) {
			case 'reward':
				{
					const reward = Number(value);
					if (!isFinite(reward) || reward < 0) return;

					set_drafts_link((state_old) => {
						const state = structuredClone(state_old);
						state[index].reward = reward;
						return state;
					});
				}
				break;
			case 'flag':
				{
					const flag = value;
					if (!flag) return;

					set_drafts_link((state_old) => {
						const state = structuredClone(state_old);
						state[index].flag.content = flag;
						return state;
					});
				}
				break;
			case 'decay':
				{
					const decay = Number(value);
					if (!isFinite(decay) || decay < 1) return;

					set_drafts_link((state_old) => {
						const state = structuredClone(state_old);
						state[index].decay = decay;
						return state;
					});
				}
				break;
		}
	}
	function onClickSave(draft: ChallengeLink) {
		const doc = items_link.find(
			(x) => x.ctf_id === draft.ctf_id && x.challenge_id === draft.challenge_id
		)!;
		const map = new Map<string, any>();

		let property: keyof typeof doc;
		for (property in doc) {
			switch (property) {
				case 'flag':
					{
						const [doc_value, draft_value] = [doc[property], draft[property]];
						if (
							doc_value.content !== draft_value.content &&
							draft_value.content
						)
							map.set(property, {
								content: draft_value.content,
								type: 'static',
							});
					}
					break;
				case 'reward':
				case 'decay':
					{
						const [doc_value, draft_value] = [doc[property], draft[property]];
						if (doc_value !== draft_value) map.set(property, draft_value);
					}
					break;
			}
		}

		if (map.size === 0) {
			addToast({
				variant: 'info',
				title: 'Challenge',
				message: 'Challenge has has no changes to save',
			});
			return;
		}

		const diff = Object.fromEntries(map.entries());
		mut_update.mutate({
			token: user.token_access,
			challenge_id: doc.challenge_id,
			event_id,
			diff,
		});
	}

	const disabled =
		mut_link.isPending ||
		mut_unlink.isPending ||
		mut_update.isPending ||
		query_search.isPending ||
		disabled_sentinel;
	return (
		<Modal
			title="Challenges"
			size="xl"
			isOpen={show}
			onClose={() => setShow(false)}
		>
			<div className="space-y-4">
				{drafts_link.length > 0 ? (
					<div className="w-full h-fit grid grid-cols-12 gap-2 place-items-center">
						<div
							className="contents bg-neutral-50 border-b border-neutral-300 text-sm font-semibold text-dark"
							role="row"
						>
							<div className="col-span-3 pb-2 w-full" role="columnheader">
								<p>Name</p>
							</div>
							<div className="col-span-2 pb-2 w-full" role="columnheader">
								<p>Decay</p>
							</div>
							<div className="col-span-3 pb-2 w-full" role="columnheader">
								<p>Reward</p>
							</div>
							<div className="col-span-3 pb-2 w-full" role="columnheader">
								<p>Flag</p>
							</div>
							<div className="col-span-1 pb-2 w-full" role="columnheader"></div>
						</div>
						{drafts_link.map((item, index) => (
							<div
								key={item.ctf_id + '+' + item.challenge_id}
								className="contents border-b border-neutral-200 last:border-b-0"
								role="row"
							>
								<div className="col-span-3 pb-2" role="cell">
									<input
										type="text"
										className="w-full h-full px-4 py-2 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
										value={item.name ?? 'N/A'}
										readOnly
									/>
								</div>
								<div className="col-span-2 pb-2" role="cell">
									<input
										type="number"
										className="w-full h-full px-4 py-2 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
										placeholder="16 solves"
										value={item.decay}
										onChange={(ev) =>
											onChangeInput(index, 'decay', ev.target.value)
										}
										disabled={disabled}
									/>
								</div>
								<div className="col-span-3 pb-2" role="cell">
									<input
										type="number"
										className="w-full h-full px-4 py-2 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
										placeholder="500 points"
										value={item.reward}
										onChange={(ev) =>
											onChangeInput(index, 'reward', ev.target.value)
										}
										disabled={disabled}
									/>
								</div>
								<div className="col-span-3 pb-2" role="cell">
									<input
										type="text"
										className="w-full h-full px-4 py-2 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
										placeholder="flag{whats_up}"
										value={item.flag.content}
										onChange={(ev) =>
											onChangeInput(index, 'flag', ev.target.value)
										}
										disabled={disabled}
									/>
								</div>
								<div
									className="col-span-1 pb-2 inline-flex items-center justify-around"
									role="cell"
								>
									<button
										type="button"
										onClick={() => onClickSave(item)}
										className="p-2 opacity-75 hover:opacity-100 bg-white rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
										aria-label="Unlink this challenge from the event"
									>
										<Icon
											name="save"
											className="size-5 shrink-0 text-dark"
											aria-hidden={false}
										/>
									</button>
									<button
										type="button"
										onClick={() => onClickUnlink(item)}
										className="p-2 opacity-75 hover:opacity-100 bg-white rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
										aria-label="Unlink this challenge from the event"
									>
										<Icon
											name="trash"
											className="size-5 shrink-0 text-dark"
											aria-hidden={false}
										/>
									</button>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="flex justify-center items-center">
						<p className="text-sm text-muted">
							No challenges linked yet. Add challenges to include them in this
							event.
						</p>
					</div>
				)}
				<SearchInput
					value={input_search}
					onChange={set_input_search}
					placeholder="Look up challenges for inclusion in this event"
				/>
				{items_search.length > 0 ? (
					<div className="w-full h-fit grid grid-cols-12 place-items-center">
						<div
							className="contents bg-neutral-50 border-b border-neutral-300 text-sm font-semibold text-dark"
							role="row"
						>
							<div className="col-span-2 pb-2" role="columnheader">
								<p>Name</p>
							</div>
							<div className="col-span-2 pb-2" role="columnheader">
								<p>Category</p>
							</div>
							<div className="col-span-1 pb-2" role="columnheader">
								<p>Reward</p>
							</div>
							<div className="col-span-2 pb-2" role="columnheader">
								<p>R. Minimum</p>
							</div>
							<div className="col-span-2 pb-2" role="columnheader">
								<p>R. Decrements</p>
							</div>
							<div className="col-span-2 pb-2" role="columnheader">
								<p>R. First Blood</p>
							</div>
							<div className="col-span-1 pb-2" role="columnheader"></div>
						</div>
						{items_search.map((item) => (
							<div
								key={item.id}
								className="contents border-b border-neutral-200 last:border-b-0"
								role="row"
							>
								<div className="col-span-2 pb-2" role="cell">
									<p>{item.name}</p>
								</div>
								<div className="col-span-2 pb-2" role="cell">
									<p>{item.category}</p>
								</div>
								<div className="col-span-1 pb-2" role="cell">
									<p>{item.reward}</p>
								</div>
								<div className="col-span-2 pb-2" role="cell">
									<p>{item.reward_min}</p>
								</div>
								<div className="col-span-2 pb-2" role="cell">
									<p>{item.reward_decrements ? 'Yes' : 'No'}</p>
								</div>
								<div className="col-span-2 pb-2" role="cell">
									<p>{item.reward_first_blood}</p>
								</div>
								<div className="col-span-1 pb-2" role="cell">
									<Button
										type="button"
										size="sm"
										disabled={disabled}
										onClick={() => onClickLink(item)}
									>
										Link
									</Button>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="flex justify-center items-center">
						<p className="text-sm text-muted">
							Search term yields no results, try another one
						</p>
					</div>
				)}
			</div>
		</Modal>
	);
}
