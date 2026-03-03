import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type SubmitEvent, type ChangeEvent, useEffect } from 'react';

import { useToast } from '~/contexts/ToastContext';
import type { SessionUser } from '~/session.server';

import Button from '~/components/Button';
import FormInput from '~/components/FormInput';
import FormToggle from '~/components/FormToggle';
import { remote_fetch_event } from '~/routes/events.$id';

export interface EventFormData {
	name: string;
	description: string;
	organizer: string;
	startDate: string;
	endDate: string;
	registrationOpen: boolean;
	teamMembersMin: string;
	teamMembersMax: string;
	maxTeams: string;
	linkedChallenges: LinkedChallenge[];
}
export interface LinkedChallenge {
	id: number;
	name: string;
	reward: number;
	rewardMin: number;
	rewardFirstBlood: number;
	flag: string;
}

interface EventFormProps {
	user?: SessionUser;
	event_id?: string;
	onCancel: () => void;
}
interface EventCreate {
	name: string;
	start_time: string;
	end_time: string;
	is_open: boolean;

	status?: 'published' | 'draft';
	max_teams?: number;
	description?: string;
	team_members_min?: number;
	team_members_max?: number;
}

export async function remote_create_event(token: string, event: EventCreate) {
	const url = new URL(
		'/api/admin/events',
		import.meta.env.BROWSER_REST_EVENTS_ORIGIN
	);

	const method = 'POST';
	const headers = new Headers({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' });
	const body = JSON.stringify(event);
	const res = await fetch(url, { method, headers, body });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');

	type JSONData_EventCreate = {
		id: number;
	};
	return json as JSONData_EventCreate;
}
export async function remote_update_event(token: string, event_id: string, diff: unknown) {
	const url = new URL(`/api/admin/events/${event_id}`, import.meta.env.BROWSER_REST_EVENTS_ORIGIN);

	const method = 'PUT';
	const headers = new Headers({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' });
	const body = JSON.stringify(diff);
	const res = await fetch(url, { method, headers, body });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
}
export default function EventForm({ user, event_id, onCancel }: EventFormProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { addToast } = useToast();

	const [input_open, setInputOpen] = useState(true);
	const [input_name, setInputName] = useState('');
	const [input_time_end, setInputTimeEnd] = useState('');
	const [input_time_start, setInputTimeStart] = useState('');
	const [input_description, setInputDescription] = useState('');
	const [input_max_teams, setInputMaxTeams] = useState('8');
	const [input_team_members_min, setInputTeamMembersMin] = useState('3');
	const [input_team_members_max, setInputTeamMembersMax] = useState('5');

	const [error_form, setErrorForm] = useState('');

	const toDateTimeInput = (d: Date): string => {
		const pad = (n: number) => String(n).padStart(2, '0');
		const year = d.getFullYear();
		const month = pad(d.getMonth() + 1);
		const day = pad(d.getDate());
		const hours = pad(d.getHours());
		const minutes = pad(d.getMinutes());
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}

	const query_event = useQuery({
		queryKey: ['event', { event_id }],
		initialData: null,
		async queryFn() {
			if (!event_id || !user)
				return null;
			return await remote_fetch_event(event_id, user.token_access);
		}
	});
	useEffect(() => {
		if (!query_event.isSuccess)
			return ;

		const data = query_event.data;
		if (!data)
			return ;

		const { event } = data;
		setInputOpen(event.status === 'published');
		setInputName(event.name);
		setInputDescription(event.description);
		setInputMaxTeams((event.max_teams ?? '').toString());
		setInputTeamMembersMin(event.team_members_min.toString());
		setInputTeamMembersMax(event.team_members_max.toString());
		setInputTimeEnd(toDateTimeInput(new Date(event.end_time)));
		setInputTimeStart(toDateTimeInput(new Date(event.start_time)));
	}, [query_event.dataUpdatedAt]);

	type MutationPayload<T> = {
		token?: string | null;
		role?: 'admin' | 'user';
	} & T;
	type MutationPayloadCreate = MutationPayload<EventCreate>
	const mut_event_create = useMutation<Awaited<ReturnType<typeof remote_create_event>>, Error, MutationPayloadCreate>({
		async mutationFn({ token, role, ...event }) {
			if (!token || role !== 'admin') throw new Error('Unauthorized');
			return await remote_create_event(token, event);
		},
		async onSuccess({ id }) {
			addToast({
				variant: 'success',
				title: 'Event Creation',
				message: 'Event has been created successfully',
			});
			await navigate(`/events/${id}`);
		},
	});
	const mut_event_update = useMutation<void, Error, MutationPayload<{ event_id: string, diff: unknown }>>({
		async mutationFn({ token, event_id, diff }) {
			if (!token)
				throw new Error('Unauthorized');
			if (Object.keys(diff ?? {}).length === 0)
				throw new Error('No fields have changed from their previous state');
			await remote_update_event(token, event_id, diff);
		},
		async onSuccess() {
			onCancel();
			await queryClient.invalidateQueries({
				queryKey: ['event', { event_id }],
			});
			addToast({
				variant: 'success',
				title: 'Event updated',
				message: 'Event has been updated succesfully',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Event update',
				message: err.message,
			});
		}
	});

	const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!input_name.trim()) {
			setErrorForm('Event name is required');
			return;
		}
		if (!input_time_start) {
			setErrorForm('Start date is required');
			return;
		}
		if (!input_time_end) {
			setErrorForm('End date is required');
			return;
		}
		if (new Date(input_time_end) <= new Date(input_time_start)) {
			setErrorForm('End date must be after start date');
			return;
		}
		setErrorForm('');

		if (event_id) {
			const diff = new Map<string, any>();

			const data = query_event.data;
			if (data === null) {
				setErrorForm('Unreachable attempt at edit submit, without an event_id');
				return ;
			}

			const { event } = data;

			// TODO(xenobas): This introduces a matrix of problems with status transitions
			if (input_name !== event.name)
				diff.set('name', input_name);
			if (new Date(input_time_end).getTime() !== new Date(event.end_time).getTime())
				diff.set('end_time', new Date(input_time_end).toISOString());
			if (new Date(input_time_start).getTime() !== new Date(event.start_time).getTime())
				diff.set('start_time', new Date(input_time_start).toISOString());
			if (input_description !== event.description)
				diff.set('description', input_description);
			if (input_max_teams !== (event.max_teams?.toString() ?? ''))
				diff.set('max_teams', input_max_teams ? Number(input_max_teams) : null);
			if (input_team_members_min !== event.team_members_min.toString())
				diff.set('team_members_min', Number(input_team_members_min));
			if (input_team_members_max !== event.team_members_max.toString())
				diff.set('team_members_max', Number(input_team_members_max));

			mut_event_update.mutate({
				diff: Object.fromEntries(diff.entries()),
				role: user?.role,
				token: user?.token_access,
				event_id,
			});
		} else {
			mut_event_create.mutate({
				name: input_name,
				description: input_description,
				is_open: input_open,

				end_time: (new Date(input_time_end)).toISOString(),
				start_time: (new Date(input_time_start)).toISOString(),

				max_teams: parseInt(input_max_teams),
				team_members_max: parseInt(input_team_members_max),
				team_members_min: parseInt(input_team_members_min),

				status: 'published',

				role: user?.role,
				token: user?.token_access,
			});
		}
	};

	const changeTeamMembersMin = (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { value } = e.target;
		const number = parseInt(value);
		const upper_boundary = parseInt(input_team_members_min) || +Infinity;

		if (isFinite(number) && number < upper_boundary)
			setInputTeamMembersMin(number.toFixed(0));
		else setInputTeamMembersMin('');
	};
	const changeTeamMembersMax = (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { value } = e.target;
		const number = parseInt(value);
		const lower_boundary = parseInt(input_team_members_min) || 0;

		if (isFinite(number) && number >= lower_boundary)
			setInputTeamMembersMax(number.toFixed(0));
		else setInputTeamMembersMax('');
	};
	const changeInputMaxTeams = (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { value } = e.target;
		const number = parseInt(value);
		setInputMaxTeams(isFinite(number) && number > 0 ? number.toFixed(0) : '');
	};

	const changeInputTimeStart = (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { value } = e.target;

		const now = new Date();
		const date = new Date(value);
		if (now >= date) setInputTimeStart('');
		else setInputTimeStart(value);
		setInputTimeEnd('');
	};
	const changeInputTimeEnd = (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { value } = e.target;

		const start = new Date(input_time_start);
		const date = new Date(value);
		if (date <= start) setInputTimeEnd('');
		else setInputTimeEnd(value);
	};

	// Use a plain className string so there's no dynamic component creation on re-render
	// (inline components lose focus on every keystroke because React sees a new component type)
	const class_section = 'pb-6 border-b border-neutral-200 last:border-b-0';
	const disabled = mut_event_create.isPending;
	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			<div className={class_section}>
				<fieldset>
					<legend className="text-xl font-semibold text-dark mb-4">
						Event Details
					</legend>
					<div className="space-y-4">
						<FormInput
							name="event-name"
							type="text"
							label="Event Name"
							value={input_name}
							onChange={(e) => setInputName(e.target.value)}
							placeholder="e.g. Winter Cyber Challenge 2026"
							required
						/>

						<FormInput
							name="event-description"
							type="textarea"
							label="Description"
							value={input_description}
							onChange={(e) => setInputDescription(e.target.value)}
							placeholder="Describe the event, rules, and objectives..."
							rows={5}
						/>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<FormInput
								name="start_time"
								label="Start Date & Time"
								type="datetime-local"
								id="event-start-date"
								value={input_time_start}
								onChange={changeInputTimeStart}
								required={!Boolean(event_id)}
								disabled={disabled || Boolean(event_id)}
							/>
							<FormInput
								name="end_time"
								label="End Date & Time"
								type="datetime-local"
								id="event-end-date"
								value={input_time_end}
								onChange={changeInputTimeEnd}
								required={!Boolean(event_id)}
								disabled={disabled || Boolean(event_id)}
							/>

							<span></span>
							<FormToggle
								name="registration-open"
								label="Registration Open"
								description="Allow new teams to register for this event"
								checked={input_open}
								onChange={setInputOpen}
								disabled={disabled || Boolean(event_id)}
							/>
						</div>
					</div>
				</fieldset>
			</div>
			<div className={class_section}>
				<fieldset>
					<legend className="text-xl font-semibold text-dark mb-4">
						Team Settings
					</legend>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div>
							<label
								htmlFor="team-members-min"
								className="block text-sm font-semibold text-dark mb-2"
							>
								Minimum members per team <span className="text-primary">*</span>
							</label>
							<input
								type="number"
								id="team-members-min"
								value={input_team_members_min}
								min={1}
								onChange={changeTeamMembersMin}
								disabled={disabled}
								className="w-full px-4 py-2.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
								required
							/>
						</div>

						<div>
							<label
								htmlFor="team-members-max"
								className="block text-sm font-semibold text-dark mb-2"
							>
								Maximum members per team <span className="text-primary">*</span>
							</label>
							<input
								type="number"
								id="team-members-max"
								value={input_team_members_max}
								min={0}
								onChange={changeTeamMembersMax}
								disabled={disabled}
								className="w-full px-4 py-2.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
								required
							/>
						</div>

						<div>
							<label
								htmlFor="max-teams"
								className="block text-sm font-semibold text-dark mb-2"
							>
								Maximum teams in the event{' '}
								<span className="text-primary">*</span>
							</label>
							<input
								type="number"
								id="max-teams"
								value={input_max_teams}
								onChange={changeInputMaxTeams}
								min={1}
								disabled={disabled}
								className="w-full px-4 py-2.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
								required
							/>
						</div>
					</div>
				</fieldset>
			</div>
			<div className="flex items-center justify-between gap-4">
				{error_form && (
					<p className="text-sm text-red-600 flex-1" role="alert">
						{error_form}
					</p>
				)}
				<div className="flex gap-3 ml-auto">
					<Button
						type="button"
						variant="secondary"
						onClick={onCancel}
						disabled={disabled}
					>
						Cancel
					</Button>
					<Button type="submit" variant="primary" disabled={disabled}>
						{ Boolean(event_id) ? "Update" : "Create"}
					</Button>
				</div>
			</div>
		</form>
	);
}
