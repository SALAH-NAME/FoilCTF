import { useState } from 'react';
import { Link } from 'react-router';
import { useToast } from '~/contexts/ToastContext';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import EventStatCard from '~/components/EventStatCard';
import PageSection from '~/components/PageSection';
import CountdownCard from '~/components/CountdownCard';
import InfoText from '~/components/InfoText';
import Modal from '~/components/Modal';
import AdminEventModal from '~/components/AdminEventModal';
import PageHeader from '~/components/PageHeader';
import BackLink from '~/components/BackLink';

interface RouteParams {
	params: {
		id: string;
	};
}

export function meta({ params }: RouteParams) {
	return [
		{ title: `Event ${params.id} - FoilCTF` },
		{ name: 'description', content: `Details for event ${params.id}` },
	];
}

export default function EventDetail({ params }: RouteParams) {
	const [isRegistered, setIsRegistered] = useState(false);
	const [showUnregisterModal, setShowUnregisterModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);

	const { addToast } = useToast();

	// Mock event data
	const event = {
		id: params.id,
		name: 'Winter Cyber Challenge 2026',
		status: 'active' as 'upcoming' | 'active' | 'ended',
		startDate: '2026-02-01T00:00:00Z',
		// status: 'upcoming' as 'upcoming' | 'active' | 'ended',
		// startDate: '2026-02-15T00:00:00Z',
		endDate: '2026-02-25T23:59:59Z',
		// status: 'ended' as 'upcoming' | 'active' | 'ended',
		// startDate: '2026-02-01T00:00:00Z',
		// endDate: '2026-02-05T23:59:59Z',
		organizer: 'CyberSec Team',
		teams: 145,
		maxTeams: 200,
		description:
			"Welcome to the Winter Cyber Challenge 2026! This two-week competition features exciting challenges across various categories including web exploitation, reverse engineering, cryptography, and forensics. Whether you're a beginner or an experienced hacker, there's something for everyone. Join teams from around the world and test your skills against the best.",
		registrationOpen: true,
		chatEnabled: true,
	};

	const handleRegistrationToggle = () => {
		if (isRegistered) {
			setShowUnregisterModal(true);
		} else {
			setIsRegistered(true);
			addToast({
				variant: 'success',
				title: 'Registration confirmed',
				message: `You are now registered for ${event.name}.`,
			});
		}
	};

	const handleConfirmUnregister = () => {
		// TODO: unregister
		setIsRegistered(false);
		setShowUnregisterModal(false);
		addToast({
			variant: 'warning',
			title: 'Unregistered',
			message: `You have been removed from ${event.name}.`,
		});
	};

	const handleCancelUnregister = () => {
		setShowUnregisterModal(false);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'active':
				return 'text-green-600';
			case 'upcoming':
				return 'text-primary';
			case 'ended':
				return 'text-muted';
			default:
				return 'text-foreground';
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<BackLink to="/events">Back to Events</BackLink>

			<PageHeader
				title={event.name}
				className="mb-4"
				action={
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowEditModal(true)}
						aria-label="Edit this event"
					>
						<Icon name="edit" className="size-4" aria-hidden={true} />
						Edit Event
					</Button>
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
									{event.name}
								</h1>
							</div>

							<div className="flex flex-col sm:flex-row sm:items-center gap-4 p-2 w-fit">
								<InfoText
									icon="user"
									className="text-white font-bold"
									iconClassName="w-5 h-5"
								>
									Organized by {event.organizer}
								</InfoText>
							</div>
						</div>

						{true == true && (
							<Link
								to="play"
								className="flex items-center no-underline text-xl text-dark bg-white hover:bg-white/80 rounded-md p-4 px-8 h-fit font-bold transition-colors w-fit"
							>
								Play
							</Link>
						)}
					</div>

					<div className="p-6 md:p-8">
						{event.registrationOpen && event.status !== 'ended' && (
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
											{isRegistered
												? 'You are registered for this event'
												: 'Join the competition and compete with teams worldwide'}
										</p>
									</div>
									<Button
										variant={isRegistered ? 'danger' : 'primary'}
										onClick={handleRegistrationToggle}
										aria-label={
											isRegistered
												? 'Unregister from this event'
												: 'Register for this event'
										}
									>
										{isRegistered ? (
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

						{event.status === 'upcoming' && (
							<div className="mb-6">
								<CountdownCard
									variant="upcoming"
									targetDate={event.startDate}
								/>
							</div>
						)}

						{event.status === 'active' && (
							<div className="mb-6">
								<CountdownCard variant="active" targetDate={event.endDate} />
							</div>
						)}

						{event.status === 'ended' && (
							<div className="mb-6">
								<div
									className={`col-span-full bg-linear-to-r from-gray-600/10 to-gray-600/5 border-neutral-300 border rounded-md p-4 md:p-6`}
								>
									<div className="flex flex-col items-center gap-3 md:gap-4">
										<h2 className="text-lg md:text-xl font-semibold text-foreground">
											Event has Ended
										</h2>
									</div>
								</div>
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
								value={formatDate(event.startDate)}
							/>

							<EventStatCard
								icon="calendar"
								label="End Date"
								value={formatDate(event.endDate)}
							/>

							<EventStatCard
								icon="user"
								label="Teams Registered"
								value={`${event.teams} / ${event.maxTeams}`}
							/>

							<EventStatCard
								icon="chart"
								label="Registration"
								value={event.registrationOpen ? 'Open' : 'Closed'}
							/>
						</div>
					</div>
				</div>
			</section>

			<PageSection>
				<div role="region" aria-labelledby="about-heading">
					<h2
						id="about-heading"
						className="text-xl md:text-2xl font-semibold text-foreground mb-4"
					>
						About This Event
					</h2>
					<div className="prose prose-sm md:prose-base max-w-none">
						<p className="text-muted leading-relaxed">{event.description}</p>
					</div>
				</div>
			</PageSection>

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
								className={`text-lg font-semibold ${getStatusColor(event.status)}`}
							>
								{event.status.charAt(0).toUpperCase() + event.status.slice(1)}
							</dd>
						</div>
						<div className="flex flex-col gap-2">
							<dt className="text-sm font-medium text-muted">Duration</dt>
							<dd className="text-lg font-semibold text-foreground">
								{Math.ceil(
									(new Date(event.endDate).getTime() -
										new Date(event.startDate).getTime()) /
										(1000 * 60 * 60 * 24)
								)}{' '}
								days
							</dd>
						</div>
						<div className="flex flex-col gap-2">
							<dt className="text-sm font-medium text-muted">Team Capacity</dt>
							<dd className="text-lg font-semibold text-foreground">
								{event.maxTeams - event.teams} spots remaining
							</dd>
						</div>
						<div className="flex flex-col gap-2">
							<dt className="text-sm font-medium text-muted">Organizer</dt>
							<dd className="text-lg font-semibold text-foreground">
								{event.organizer}
							</dd>
						</div>
					</dl>
				</div>
			</PageSection>

			{event.status !== 'upcoming' && (
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
							<Button variant="primary">
								View Leaderboard
								<Icon name="chevronRight" className="w-4 h-4" />
							</Button>
						</Link>
					</div>
				</PageSection>
			)}

			<Modal
				isOpen={showUnregisterModal}
				onClose={handleCancelUnregister}
				title="Confirm Unregistration"
				size="sm"
				footer={
					<div className="flex gap-3 justify-end">
						<Button
							variant="secondary"
							onClick={handleCancelUnregister}
							type="button"
							aria-label="Cancel unregistration"
						>
							Cancel
						</Button>
						<Button
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
						<strong className="font-semibold">{event.name}</strong>?
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

			<AdminEventModal
				isOpen={showEditModal}
				onClose={() => setShowEditModal(false)}
				eventId={params.id}
				initialData={{
					name: event.name,
					description: event.description,
					organizer: event.organizer,
					startDate: event.startDate.slice(0, 16),
					endDate: event.endDate.slice(0, 16),
					registrationOpen: event.registrationOpen,
					linkedChallenges: [],
				}}
			/>
		</div>
	);
}
