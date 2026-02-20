import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import FormInput from './FormInput';
import FormToggle from './FormToggle';
import Button from './Button';
import Icon from './Icon';
import SearchInput from './SearchInput';
import { api_challenge_list } from '../api';

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
	initialData?: Partial<EventFormData>;
	onSubmit: (data: EventFormData) => void;
	onCancel: () => void;
	isSubmitting?: boolean;
	submitLabel?: string;
	/** When true, removes PageSection card wrappers for use inside a Modal */
	compact?: boolean;
}

export default function EventForm({
	initialData,
	onSubmit,
	onCancel,
	isSubmitting = false,
	submitLabel = 'Create Event',
	compact = false,
}: EventFormProps) {
	const [name, setName] = useState(initialData?.name ?? '');
	const [description, setDescription] = useState(
		initialData?.description ?? ''
	);
	const [organizer, setOrganizer] = useState(initialData?.organizer ?? '');
	const [startDate, setStartDate] = useState(initialData?.startDate ?? '');
	const [endDate, setEndDate] = useState(initialData?.endDate ?? '');
	const [registrationOpen, setRegistrationOpen] = useState(
		initialData?.registrationOpen ?? true
	);
	const [teamMembersMin, setTeamMembersMin] = useState(
		initialData?.teamMembersMin ?? '1'
	);
	const [teamMembersMax, setTeamMembersMax] = useState(
		initialData?.teamMembersMax ?? '5'
	);
	const [maxTeams, setMaxTeams] = useState(initialData?.maxTeams ?? '100');
	const [linkedChallenges, setLinkedChallenges] = useState<LinkedChallenge[]>(
		initialData?.linkedChallenges ?? []
	);

	const [challengeSearch, setChallengeSearch] = useState('');
	const [formError, setFormError] = useState('');

	const mockChallenges: ChallengeOption[] = [
		{
			id: 101,
			name: 'SQL Injection 101',
			reward: 100,
			rewardMin: 50,
			rewardFirstBlood: 25,
			description: 'Basic SQL injection',
		},
		{
			id: 102,
			name: 'XSS Adventure',
			reward: 150,
			rewardMin: 75,
			rewardFirstBlood: 35,
			description: 'Cross-site scripting',
		},
		{
			id: 103,
			name: 'Buffer Overflow',
			reward: 300,
			rewardMin: 150,
			rewardFirstBlood: 75,
			description: 'Classic buffer overflow',
		},
		{
			id: 104,
			name: 'RSA Cracker',
			reward: 250,
			rewardMin: 100,
			rewardFirstBlood: 60,
			description: 'Break weak RSA',
		},
		{
			id: 105,
			name: 'Forensics: Hidden File',
			reward: 200,
			rewardMin: 80,
			rewardFirstBlood: 50,
			description: 'Find the hidden flag',
		},
		{
			id: 106,
			name: 'Reverse Me',
			reward: 350,
			rewardMin: 175,
			rewardFirstBlood: 85,
			description: 'Reverse engineering challenge',
		},
	];

	// Fetch available challenges for linking
	const { data: fetchedChallenges } = useQuery({
		queryKey: ['challenges-for-linking'],
		queryFn: async () => {
			const result = await api_challenge_list();
			return (Array.isArray(result) ? result : []) as ChallengeOption[];
		},
		initialData: [],
	});

	const availableChallenges =
		fetchedChallenges.length > 0 ? fetchedChallenges : mockChallenges;

	// Sync initial data on changes
	useEffect(() => {
		if (initialData) {
			setName(initialData.name ?? '');
			setDescription(initialData.description ?? '');
			setOrganizer(initialData.organizer ?? '');
			setStartDate(initialData.startDate ?? '');
			setEndDate(initialData.endDate ?? '');
			setRegistrationOpen(initialData.registrationOpen ?? true);
			setTeamMembersMin(initialData.teamMembersMin ?? '1');
			setTeamMembersMax(initialData.teamMembersMax ?? '5');
			setMaxTeams(initialData.maxTeams ?? '100');
			setLinkedChallenges(initialData.linkedChallenges ?? []);
		}
	}, [initialData]);

	const filteredChallenges = availableChallenges.filter((ch) => {
		const matchesSearch = ch.name
			.toLowerCase()
			.includes(challengeSearch.toLowerCase());
		const notLinked = !linkedChallenges.some((lc) => lc.id === ch.id);
		return matchesSearch && notLinked;
	});

	const handleLinkChallenge = (challenge: ChallengeOption) => {
		setLinkedChallenges((prev) => [
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
		setChallengeSearch('');
	};

	const handleUnlinkChallenge = (challengeId: number) => {
		setLinkedChallenges((prev) => prev.filter((ch) => ch.id !== challengeId));
	};

	const handleChallengeFlag = (challengeId: number, flag: string) => {
		setLinkedChallenges((prev) =>
			prev.map((ch) => (ch.id === challengeId ? { ...ch, flag } : ch))
		);
	};

	const handleChallengeReward = (challengeId: number, reward: number) => {
		setLinkedChallenges((prev) =>
			prev.map((ch) => (ch.id === challengeId ? { ...ch, reward } : ch))
		);
	};

	const handleChallengeRewardMin = (challengeId: number, rewardMin: number) => {
		setLinkedChallenges((prev) =>
			prev.map((ch) => (ch.id === challengeId ? { ...ch, rewardMin } : ch))
		);
	};

	const handleChallengeFirstBlood = (
		challengeId: number,
		rewardFirstBlood: number
	) => {
		setLinkedChallenges((prev) =>
			prev.map((ch) =>
				ch.id === challengeId ? { ...ch, rewardFirstBlood } : ch
			)
		);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			setFormError('Event name is required');
			return;
		}
		if (!startDate) {
			setFormError('Start date is required');
			return;
		}
		if (!endDate) {
			setFormError('End date is required');
			return;
		}
		if (new Date(endDate) <= new Date(startDate)) {
			setFormError('End date must be after start date');
			return;
		}

		setFormError('');
		onSubmit({
			name,
			description,
			organizer,
			startDate,
			endDate,
			registrationOpen,
			teamMembersMin,
			teamMembersMax,
			maxTeams,
			linkedChallenges,
		});
	};

	// Use a plain className string so there's no dynamic component creation on re-render
	// (inline components lose focus on every keystroke because React sees a new component type)
	const sectionClass = compact
		? 'pb-6 border-b border-neutral-200 last:border-b-0'
		: 'bg-surface border border-neutral-300 rounded-md p-4 md:p-6';

	return (
		<form
			onSubmit={handleSubmit}
			className={`space-y-6 ${compact ? '' : 'max-w-4xl'}`}
		>
			<div className={sectionClass}>
				<fieldset>
					<legend className="text-xl font-semibold text-dark mb-4">
						Event Details
					</legend>
					<div className="space-y-4">
						<FormInput
							name="event-name"
							type="text"
							label="Event Name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Winter Cyber Challenge 2026"
							required
						/>

						<FormInput
							name="event-description"
							type="textarea"
							label="Description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe the event, rules, and objectives..."
							rows={5}
						/>

						<FormInput
							name="event-organizer"
							type="text"
							label="Organizer"
							value={organizer}
							onChange={(e) => setOrganizer(e.target.value)}
							placeholder="e.g. CyberSec Team"
						/>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label
									htmlFor="event-start-date"
									className="block text-sm font-semibold text-dark mb-2"
								>
									Start Date & Time
								</label>
								<input
									type="datetime-local"
									id="event-start-date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									required
									disabled={isSubmitting}
									className="w-full px-4 py-2.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
								/>
							</div>

							<div>
								<label
									htmlFor="event-end-date"
									className="block text-sm font-semibold text-dark mb-2"
								>
									End Date & Time
								</label>
								<input
									type="datetime-local"
									id="event-end-date"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
									required
									disabled={isSubmitting}
									className="w-full px-4 py-2.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
								/>
							</div>
						</div>

						<FormToggle
							name="registration-open"
							label="Registration Open"
							description="Allow new teams to register for this event"
							checked={registrationOpen}
							onChange={setRegistrationOpen}
							disabled={isSubmitting}
						/>
					</div>
				</fieldset>
			</div>

			<div className={sectionClass}>
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
								Min Team Size
							</label>
							<input
								type="number"
								id="team-members-min"
								value={teamMembersMin}
								onChange={(e) => setTeamMembersMin(e.target.value)}
								min={1}
								disabled={isSubmitting}
								className="w-full px-4 py-2.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
							/>
						</div>

						<div>
							<label
								htmlFor="team-members-max"
								className="block text-sm font-semibold text-dark mb-2"
							>
								Max Team Size
							</label>
							<input
								type="number"
								id="team-members-max"
								value={teamMembersMax}
								onChange={(e) => setTeamMembersMax(e.target.value)}
								min={1}
								disabled={isSubmitting}
								className="w-full px-4 py-2.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
							/>
						</div>

						<div>
							<label
								htmlFor="max-teams"
								className="block text-sm font-semibold text-dark mb-2"
							>
								Max Teams
							</label>
							<input
								type="number"
								id="max-teams"
								value={maxTeams}
								onChange={(e) => setMaxTeams(e.target.value)}
								min={1}
								disabled={isSubmitting}
								className="w-full px-4 py-2.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
							/>
						</div>
					</div>
				</fieldset>
			</div>

			<div className={sectionClass}>
				<fieldset>
					<legend className="text-xl font-semibold text-dark mb-4">
						Linked Challenges
					</legend>

					{linkedChallenges.length > 0 && (
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
								{linkedChallenges.map((ch) => (
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
												disabled={isSubmitting}
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
												disabled={isSubmitting}
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
												disabled={isSubmitting}
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
												disabled={isSubmitting}
												className="w-full px-2 py-1.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-sm font-mono"
											/>
										</div>
										<div className="col-span-1 flex justify-end" role="cell">
											<button
												type="button"
												onClick={() => handleUnlinkChallenge(ch.id)}
												disabled={isSubmitting}
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

					{linkedChallenges.length === 0 && (
						<p className="text-sm text-muted mb-4">
							No challenges linked yet. Add challenges to include them in this
							event.
						</p>
					)}

					<div className="space-y-3">
						<SearchInput
							value={challengeSearch}
							onChange={setChallengeSearch}
							placeholder="Search challenges by name..."
						/>

						{filteredChallenges.length > 0 ? (
							<ul
								className="max-h-52 overflow-y-auto space-y-1 border border-neutral-200 rounded-md p-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:rounded-full"
								role="listbox"
								aria-label="Available challenges to link"
							>
								{filteredChallenges.map((ch) => (
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
							<p className="text-sm text-muted py-2">
								{challengeSearch
									? 'No matching challenges found'
									: 'All challenges already linked'}
							</p>
						)}
					</div>
				</fieldset>
			</div>

			<div className="flex items-center justify-between gap-4">
				{formError && (
					<p className="text-sm text-red-600 flex-1" role="alert">
						{formError}
					</p>
				)}
				<div className="flex gap-3 ml-auto">
					<Button
						type="button"
						variant="secondary"
						onClick={onCancel}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button type="submit" variant="primary" disabled={isSubmitting}>
						{submitLabel}
					</Button>
				</div>
			</div>
		</form>
	);
}
