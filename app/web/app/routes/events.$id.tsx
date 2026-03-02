import { useEffect, useState } from 'react';
import { data, Link, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useToast } from '~/contexts/ToastContext';
import { request_session_user } from '~/session.server';

import type { Route } from './+types/events.$id';

import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import InfoText from '~/components/InfoText';
import BackLink from '~/components/BackLink';
import PageHeader from '~/components/PageHeader';
import PageSection from '~/components/PageSection';
import CountdownCard from '~/components/CountdownCard';
import EventStatCard from '~/components/EventStatCard';
import AdminEventModal from '~/components/AdminEventModal';

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
	const url = new URL(`/api/events/${id}`, import.meta.env.BROWSER_REST_EVENTS_ORIGIN);
	const headers = new Headers();
	if (token)
		headers.set('Authorization', `Bearer ${token}`);
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
		organizers: { username: string, avatar: string }[];
		user_status: {
			is_organizer: boolean;
			is_guest: boolean;
			is_joined: boolean;
		};
	};
	return json as JSONData_Event;
}
export async function remote_fetch_team(token: string) {
	const url = new URL(`/api/teams/me`, import.meta.env.BROWSER_REST_USER_ORIGIN);
	const headers = new Headers({ 'Authorization': `Bearer ${token}`});
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
	const url = new URL(`/api/events/${id}/join`, import.meta.env.BROWSER_REST_EVENTS_ORIGIN);
	const method = 'POST';
	const headers = new Headers({ 'Authorization': `Bearer ${token}` });
	const res = await fetch(url, { method, headers });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');

	type JSONData_Join = {
		ok: true,
	};
	return json as JSONData_Join;
}
export async function remote_leave_event(token: string, id: string | number) {
	const url = new URL(`/api/events/${id}/leave`, import.meta.env.BROWSER_REST_EVENTS_ORIGIN);
	const method = 'DELETE';
	const headers = new Headers({ 'Authorization': `Bearer ${token}` });
	const res = await fetch(url, { method, headers });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');

	type JSONData_Leave = {
		ok: true,
	};
	return json as JSONData_Leave;
}
export async function remote_delete_event(token: string, id: string | number) {
	const url = new URL(`/api/admin/events/${id}`, import.meta.env.BROWSER_REST_EVENTS_ORIGIN);
	const method = 'DELETE';
	const headers = new Headers({ 'Authorization': `Bearer ${token}` });
	const res = await fetch(url, { method, headers });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');

	type JSONData_Delete = {
		ok: true,
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

	const queryClient = useQueryClient();

	const query_event = useQuery({
		queryKey: ['event', { event_id: params.id, username: user?.username, token: user?.token_access }],
		initialData: null,
		async queryFn() {
			return await remote_fetch_event(params.id, user?.token_access);
		}
	});
	const query_team = useQuery({
		queryKey: ['team', { token: user?.token_access, username: user?.username }],
		initialData: null,
		async queryFn() {
			const token = user?.token_access;
			if (!token)
				return null;
			return await remote_fetch_team(token);
		}
	});

	const data_team = query_team.data;
	const data_event = query_event.data;

	type MutationPayload<T> = {
		token?: string | null;
		role?: 'admin' | 'user';
	} & T;
	const mut_join = useMutation<unknown, Error, MutationPayload<{ event_id?: string | number; }>>({
		async mutationFn({ token, event_id }) {
			if (!token)
				throw new Error('Unauthorized');
			if (!event_id)
				throw new Error('Event not found');
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
		}
	});
	const mut_leave = useMutation<unknown, Error, MutationPayload<{ event_id?: string | number; }>>({
		async mutationFn({ token, event_id }) {
			if (!token)
				throw new Error('Unauthorized');
			if (!event_id)
				throw new Error('Event not found');
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
		}
	});
	const mut_delete = useMutation<unknown, Error, MutationPayload<{ event_id?: string | number; }>>({
		async mutationFn({ token, role, event_id }) {
			if (!token || role !== 'admin')
				throw new Error('Unauthorized');
			if (!event_id)
				throw new Error('Event not found');
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
		}
	});

	const is_registered = Boolean(user && data_event && data_event.user_status.is_joined);
	const can_show_play = Boolean((is_registered && data_event?.event.status === 'active') || data_event?.user_status.is_organizer);
	const can_show_registration = Boolean(user && data_event && data_event?.event.status === 'published' && data_team?.captain_name === user.username);
	const organizer = ((data_event?.organizers.map(x => x.username).filter(x => !!x).join(', ')) || 'FoilCTF');

	const disabled = query_event.isPending || mut_join.isPending || mut_leave.isPending || mut_delete.isPending;

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
	}

	const formatDate = (date_string?: string) => {
		if (!date_string)
			return 'N/A';
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
		if (!start_time || !end_time)
			return ('N/A');
		const start_date = new Date(start_time);
		const end_date = new Date(end_time);

		const diff = end_date.getTime() - start_date.getTime();
		return Math.ceil(diff / (1000 * 60 * 60 * 24));
	}

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
	return (
		<div className="flex flex-col gap-4">
			<BackLink to="/events">Events</BackLink>

			<PageHeader
				title={data_event?.event.name ?? 'N/A'}
				className="mb-4"
				action={ Boolean(data_event) && user?.role === "admin" && <div className="inline-flex gap-4 items-center">
					<Button
						disabled={disabled}
						variant="danger"
						size="sm"
						onClick={() => setShowModalDelete(true)}
						aria-label="Delete this event"
					>
						<Icon name="trash" className="size-4" aria-hidden={true} />
						Delete Event
					</Button>
					<Button
						disabled={disabled}
						variant="ghost"
						size="sm"
						onClick={() => setShowModalEdit(true)}
						aria-label="Edit this event"
					>
						<Icon name="edit" className="size-4" aria-hidden={true} />
						Edit Event
					</Button>
					</div>
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
								value={data_event?.event.status === 'published' ? 'Open' : 'Closed'}
							/>
						</div>
					</div>
				</div>
			</section>

			{data_event?.event.description && 
			<PageSection>
				<div role="region" aria-labelledby="about-heading">
					<h2
						id="about-heading"
						className="text-xl md:text-2xl font-semibold text-foreground mb-4"
					>
						About This Event
					</h2>
					<div className="prose prose-sm md:prose-base max-w-none">
						<p className="text-muted leading-relaxed">{data_event.event.description}</p>
					</div>
				</div>
			</PageSection> }

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
								{(data_event?.event.status.charAt(0).toUpperCase() ?? '') + (data_event?.event.status.slice(1) ?? '')}
							</dd>
						</div>
						<div className="flex flex-col gap-2">
							<dt className="text-sm font-medium text-muted">Duration</dt>
							<dd className="text-lg font-semibold text-foreground">
								<span>{formatDuration(data_event?.event.start_time, data_event?.event.end_time)}</span>
								<span> day{(formatDuration(data_event?.event.start_time, data_event?.event.end_time) === 1) && 's'}</span>
							</dd>
						</div>
						<div className="flex flex-col gap-2">
							<dt className="text-sm font-medium text-muted">Team Capacity</dt>
							<dd className="text-lg font-semibold text-foreground">
								{(data_event?.event.max_teams ?? 0) - (data_event?.event.participation_count ?? 0)} spots remaining
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
						<strong className="font-semibold">{data_event?.event.name ?? 'N/A'}</strong>?
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
						<strong className="font-semibold"> {data_event?.event.name ?? 'N/A'}</strong>?
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
									Every associated piece of data will be lost, that is including participations, chatrooms, challenges, and more...
								</p>
							</div>
						</div>
					</div>
				</div>
			</Modal>

			<AdminEventModal
				isOpen={show_modal_edit}
				onClose={() => setShowModalEdit(false)}
			/>
		</div>
	);
}
