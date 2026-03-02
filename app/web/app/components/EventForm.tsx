import { useToast } from '~/contexts/ToastContext';
import { useNavigate } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type SubmitEvent, type ChangeEvent } from 'react';

import type { SessionUser } from '~/session.server';

import Icon from '~/components/Icon';
import Button from '~/components/Button';
import FormInput from '~/components/FormInput';
import FormToggle from '~/components/FormToggle';
import SearchInput from '~/components/SearchInput';

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

interface ChallengeOption {
	id: number;
	name: string;
	reward: number;
	rewardMin?: number;
	rewardFirstBlood?: number;
	description: string;
}
interface EventFormProps {
	user?: SessionUser;
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
	const headers = new Headers({ Authorization: `Bearer ${token}` });
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

export default function EventForm({ user, onCancel }: EventFormProps) {
	const navigate = useNavigate();
	const { addToast } = useToast();

	const [input_open, setInputOpen] = useState(true);
	const [input_name, setInputName] = useState('');
	const [input_time_end, setInputTimeEnd] = useState('');
	const [input_time_start, setInputTimeStart] = useState('');
	const [input_description, setInputDescription] = useState('');
	const [input_max_teams, setInputMaxTeams] = useState('8');
	const [input_team_members_min, setInputTeamMembersMin] = useState('3');
	const [input_team_members_max, setInputTeamMembersMax] = useState('5');
	const [input_challenges, setInputLinkedChallenges] = useState<
		LinkedChallenge[]
	>([]);

	const [error_form, setErrorForm] = useState('');
	const [search_challenges, setSearchChallenges] = useState('');

	// TODO(xenobas): Fetch available challenges for linking
	const query_challenges = useQuery({
		queryKey: ['challenges-for-linking'],
		initialData: [],
		queryFn: async () => {
			// const result = await api_challenge_list();
			//return (Array.isArray(result) ? result : []) as ChallengeOption[];
			return [] as ChallengeOption[];
		},
	});
	const data_challenges = query_challenges.data.filter(({ id }) => {
		return !input_challenges.some((lc) => lc.id === id);
	});

	type MutationPayload<T> = {
		token?: string | null;
		role?: 'admin' | 'user';
	} & T;
	type MutationPayloadCreate = MutationPayload<EventCreate>;
	const mut_event = useMutation<
		Awaited<ReturnType<typeof remote_create_event>>,
		Error,
		MutationPayloadCreate
	>({
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

	const handleLinkChallenge = (challenge: ChallengeOption) => {
		setInputLinkedChallenges((prev) => [
			...prev,
			{
				id: challenge.id,
				name: challenge.name,
				reward: challenge.reward,
				rewardMin: challenge.rewardMin ?? Math.floor(challenge.reward / 2),
				rewardFirstBlood:
					challenge.rewardFirstBlood ?? Math.floor(challenge.reward / 4),
				flag: '',
			},
		]);
		setSearchChallenges('');
	};
	const handleUnlinkChallenge = (challengeId: number) => {
		setInputLinkedChallenges((prev) =>
			prev.filter((ch) => ch.id !== challengeId)
		);
	};
	const handleChallengeFlag = (challengeId: number, flag: string) => {
		setInputLinkedChallenges((prev) =>
			prev.map((ch) => (ch.id === challengeId ? { ...ch, flag } : ch))
		);
	};
	const handleChallengeReward = (challengeId: number, reward: number) => {
		setInputLinkedChallenges((prev) =>
			prev.map((ch) => (ch.id === challengeId ? { ...ch, reward } : ch))
		);
	};
	const handleChallengeRewardMin = (challengeId: number, rewardMin: number) => {
		setInputLinkedChallenges((prev) =>
			prev.map((ch) => (ch.id === challengeId ? { ...ch, rewardMin } : ch))
		);
	};
	const handleChallengeFirstBlood = (
		challengeId: number,
		rewardFirstBlood: number
	) => {
		setInputLinkedChallenges((prev) =>
			prev.map((ch) =>
				ch.id === challengeId ? { ...ch, rewardFirstBlood } : ch
			)
		);
	};
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

		mut_event.mutate({
			name: input_name,
			description: input_description,
			is_open: input_open,

			end_time: new Date(input_time_end).toISOString(),
			start_time: new Date(input_time_start).toISOString(),

			max_teams: parseInt(input_max_teams),
			team_members_max: parseInt(input_team_members_max),
			team_members_min: parseInt(input_team_members_min),

			status: 'published',

			role: user?.role,
			token: user?.token_access,
		});
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
	const disabled = query_challenges.isPending || mut_event.isPending;
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
								required
								disabled={disabled}
							/>
							<FormInput
								name="end_time"
								label="End Date & Time"
								type="datetime-local"
								id="event-end-date"
								value={input_time_end}
								onChange={changeInputTimeEnd}
								required
								disabled={disabled}
							/>

							<span></span>
							<FormToggle
								name="registration-open"
								label="Registration Open"
								description="Allow new teams to register for this event"
								checked={input_open}
								onChange={setInputOpen}
								disabled={disabled}
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
			<div className={class_section}>
				<fieldset>
					<legend className="text-xl font-semibold text-dark mb-4">
						Linked Challenges
					</legend>

					{input_challenges.length > 0 && (
						<div className="mb-4">
							<div
								className="border border-neutral-300 rounded-md overflow-hidden"
								role="table"
								aria-label="Linked challenges"
							>
								<div
									className="bg-neutral-50 border-b border-neutral-300 grid grid-cols-12 gap-2 px-4 py-3 text-sm font-semibold text-dark"
									role="row"
								>
									<span className="col-span-3" role="columnheader">
										Challenge
									</span>
									<span className="col-span-2" role="columnheader">
										Max Pts
									</span>
									<span className="col-span-2" role="columnheader">
										Min Pts
									</span>
									<span className="col-span-2" role="columnheader">
										First Blood
									</span>
									<span className="col-span-2" role="columnheader">
										Flag
									</span>
									<span className="col-span-1" role="columnheader">
										<span className="sr-only">Actions</span>
									</span>
								</div>
								{input_challenges.map((ch) => (
									<div
										key={ch.id}
										className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-neutral-200 last:border-b-0 items-center"
										role="row"
									>
										<span
											className="col-span-3 text-sm text-dark font-medium truncate"
											role="cell"
											title={ch.name}
										>
											{ch.name}
										</span>
										<div className="col-span-2" role="cell">
											<label htmlFor={`reward-${ch.id}`} className="sr-only">
												Max points for {ch.name}
											</label>
											<input
												type="number"
												id={`reward-${ch.id}`}
												value={ch.reward}
												onChange={(e) =>
													handleChallengeReward(ch.id, Number(e.target.value))
												}
												min={0}
												disabled={disabled}
												className="w-full px-2 py-1.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm"
											/>
										</div>
										<div className="col-span-2" role="cell">
											<label
												htmlFor={`reward-min-${ch.id}`}
												className="sr-only"
											>
												Min points for {ch.name}
											</label>
											<input
												type="number"
												id={`reward-min-${ch.id}`}
												value={ch.rewardMin}
												onChange={(e) =>
													handleChallengeRewardMin(
														ch.id,
														Number(e.target.value)
													)
												}
												min={0}
												disabled={disabled}
												className="w-full px-2 py-1.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm"
											/>
										</div>
										<div className="col-span-2" role="cell">
											<label
												htmlFor={`first-blood-${ch.id}`}
												className="sr-only"
											>
												First blood bonus for {ch.name}
											</label>
											<input
												type="number"
												id={`first-blood-${ch.id}`}
												value={ch.rewardFirstBlood}
												onChange={(e) =>
													handleChallengeFirstBlood(
														ch.id,
														Number(e.target.value)
													)
												}
												min={0}
												disabled={disabled}
												className="w-full px-2 py-1.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm"
											/>
										</div>
										<div className="col-span-2" role="cell">
											<label htmlFor={`flag-${ch.id}`} className="sr-only">
												Flag for {ch.name}
											</label>
											<input
												type="text"
												id={`flag-${ch.id}`}
												value={ch.flag}
												onChange={(e) =>
													handleChallengeFlag(ch.id, e.target.value)
												}
												placeholder="flag{...}"
												disabled={disabled}
												className="w-full px-2 py-1.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm font-mono"
											/>
										</div>
										<div className="col-span-1 flex justify-end" role="cell">
											<button
												type="button"
												onClick={() => handleUnlinkChallenge(ch.id)}
												disabled={disabled}
												className="p-1.5 hover:bg-red-50 text-white hover:text-red-500 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
												aria-label={`Remove ${ch.name} from event`}
											>
												<Icon
													name="close"
													className="size-4 stroke-3"
													aria-hidden={true}
												/>
											</button>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{input_challenges.length === 0 && (
						<p className="text-sm text-muted mb-4">
							No challenges linked yet. Add challenges to include them in this
							event.
						</p>
					)}

					<div className="space-y-3">
						<SearchInput
							value={search_challenges}
							onChange={setSearchChallenges}
							placeholder="Search challenges by name..."
						/>

						{data_challenges.length > 0 ? (
							<ul
								className="max-h-52 overflow-y-auto space-y-1 border border-neutral-200 rounded-md p-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:rounded-full"
								role="listbox"
								aria-label="Available challenges to link"
							>
								{data_challenges.map((ch) => (
									<li key={ch.id} role="option" aria-selected={false}>
										<button
											type="button"
											onClick={() => handleLinkChallenge(ch)}
											className="w-full text-left px-3 py-2 rounded-md text-white hover:text-primary hover:bg-primary/10 transition-colors flex items-center justify-between gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
											aria-label={`Link challenge ${ch.name}`}
										>
											<span className="text-sm font-medium truncate">
												{ch.name}
											</span>
											<span className="text-xs  shrink-0">{ch.reward} pts</span>
										</button>
									</li>
								))}
							</ul>
						) : (
							search_challenges && (
								<p className="text-sm text-muted py-2">
									No matching challenges found
								</p>
							)
						)}
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
						Create Event
					</Button>
				</div>
			</div>
		</form>
	);
}
