import { useState } from 'react';
import { useNavigate } from 'react-router';
import PageHeader from '~/components/PageHeader';
import BackLink from '~/components/BackLink';
import EventForm from '~/components/EventForm';
import type { EventFormData } from '~/components/EventForm';

interface RouteParams {
	params: {
		id: string;
	};
}

export function meta({ params }: RouteParams) {
	return [
		{ title: `Edit Event ${params.id} - FoilCTF` },
		{
			name: 'description',
			content: `Edit CTF event ${params.id}`,
		},
	];
}

// Mock data for edit mode — replace with API call when backend supports it
function getMockEvent(id: string): Partial<EventFormData> {
	const events: Record<string, Partial<EventFormData>> = {
		'1': {
			name: 'Winter Cyber Challenge 2026',
			description:
				'Welcome to the Winter Cyber Challenge 2026! This two-week competition features exciting challenges across various categories.',
			organizer: 'CyberSec Team',
			startDate: '2026-02-01T00:00',
			endDate: '2026-02-15T23:59',
			registrationOpen: true,
			teamMembersMin: '1',
			teamMembersMax: '5',
			maxTeams: '200',
			linkedChallenges: [],
		},
		'3': {
			name: 'Spring CTF Championship',
			description:
				'A premier CTF competition featuring challenges in web exploitation, cryptography, reverse engineering, and forensics.',
			organizer: 'HackMasters',
			startDate: '2026-03-15T00:00',
			endDate: '2026-03-29T23:59',
			registrationOpen: true,
			teamMembersMin: '2',
			teamMembersMax: '4',
			maxTeams: '150',
			linkedChallenges: [],
		},
	};

	return (
		events[id] ?? {
			name: `Event ${id}`,
			description: '',
			organizer: '',
			startDate: '',
			endDate: '',
			registrationOpen: true,
			teamMembersMin: '1',
			teamMembersMax: '5',
			maxTeams: '100',
			linkedChallenges: [],
		}
	);
}

export default function EventEdit({ params }: RouteParams) {
	const navigate = useNavigate();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [success, setSuccess] = useState(false);

	const eventId = params.id;
	const initialData = getMockEvent(eventId);

	const handleSubmit = async (data: EventFormData) => {
		setIsSubmitting(true);

		try {
			// PUT /api/ctfs/:id with updated payload
			console.log(`Event ${eventId} update payload:`, {
				team_members_min: Number(data.teamMembersMin),
				team_members_max: Number(data.teamMembersMax),
				metadata: {
					name: data.name,
					description: data.description,
					organizer: data.organizer,
					start_date: data.startDate,
					end_date: data.endDate,
					registration_open: data.registrationOpen,
					max_teams: Number(data.maxTeams),
				},
				challenges: data.linkedChallenges.map((ch) => ({
					challenge_id: ch.id,
					reward: ch.reward,
					flag: { type: 'static', value: ch.flag },
				})),
			});

			setSuccess(true);
			setTimeout(() => navigate(`/events/${eventId}`), 1500);
		} catch (error) {
			console.error('Failed to update event:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		navigate(`/events/${eventId}`);
	};

	return (
		<div className="flex flex-col gap-4">
			<BackLink to={`/events/${eventId}`}>Back to Event</BackLink>

			<PageHeader title="Edit Event" />

			{success ? (
				<div
					className="max-w-4xl bg-green-50 border border-green-200 rounded-md p-6 text-center"
					role="status"
					aria-live="polite"
				>
					<p className="text-lg font-semibold text-green-900 mb-2">
						Event Updated Successfully!
					</p>
					<p className="text-sm text-green-700">Redirecting to event page...</p>
				</div>
			) : (
				<EventForm
					initialData={initialData}
					onSubmit={handleSubmit}
					onCancel={handleCancel}
					isSubmitting={isSubmitting}
					submitLabel="Update Event"
				/>
			)}
		</div>
	);
}
