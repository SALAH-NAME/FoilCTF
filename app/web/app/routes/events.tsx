import { data, useSearchParams } from 'react-router';
import { useState, useEffect } from 'react';

import type { Route } from './+types/events';

import Icon from '~/components/Icon';
import Button from '~/components/Button';
import EventCard from '~/components/EventCard';
import FilterTabs from '~/components/FilterTabs';
import Pagination from '~/components/Pagination';
import PageHeader from '~/components/PageHeader';
import SearchInput from '~/components/SearchInput';
import AdminEventModal from '~/components/AdminEventModal';
import { useQuery } from '@tanstack/react-query';
import { request_session } from '~/session.server';

type EventStatus = 'upcoming' | 'active' | 'ended';
interface Event {
	id: string;
	name: string;
	status: EventStatus;
	startDate: string;
	endDate: string;
	organizer: string;
	teams: number;
	maxTeams: number;
}

// Mock data
const mockEvents: Event[] = [
	{
		id: '1',
		name: 'Winter Cyber Challenge 2026',
		status: 'active',
		startDate: '2026-02-01',
		endDate: '2026-02-15',
		organizer: 'CyberSec Team',
		teams: 145,
		maxTeams: 200,
	},
	{
		id: '2',
		name: 'New Year Security Sprint',
		status: 'ended',
		startDate: '2026-01-10',
		endDate: '2026-01-25',
		organizer: 'SecurityPros',
		teams: 89,
		maxTeams: 100,
	},
	{
		id: '3',
		name: 'Spring CTF Championship',
		status: 'upcoming',
		startDate: '2026-03-15',
		endDate: '2026-03-29',
		organizer: 'HackMasters',
		teams: 23,
		maxTeams: 150,
	},
	{
		id: '4',
		name: 'Easter Egg Hunt CTF',
		status: 'upcoming',
		startDate: '2026-04-05',
		endDate: '2026-04-12',
		organizer: 'Digital Detectives',
		teams: 8,
		maxTeams: 80,
	},
	{
		id: '5',
		name: 'Global Pwn Competition',
		status: 'active',
		startDate: '2026-02-05',
		endDate: '2026-02-12',
		organizer: 'International CTF League',
		teams: 287,
		maxTeams: 300,
	},
	{
		id: '6',
		name: 'Holiday Hacking Challenge',
		status: 'ended',
		startDate: '2025-12-20',
		endDate: '2026-01-05',
		organizer: 'PwnStars',
		teams: 156,
		maxTeams: 160,
	},
	{
		id: '7',
		name: "Valentine's Day Crypto CTF",
		status: 'upcoming',
		startDate: '2026-02-14',
		endDate: '2026-02-16',
		organizer: 'CryptoMasters',
		teams: 0,
		maxTeams: 50,
	},
	{
		id: '8',
		name: 'January Forensics Fest',
		status: 'ended',
		startDate: '2026-01-15',
		endDate: '2026-01-22',
		organizer: 'ForensicsPro',
		teams: 67,
		maxTeams: 75,
	},
];

export async function remote_fetch_events(q: string, page: number, limit: number) {
	const url = new URL('/api/events', import.meta.env.BROWSER_REST_EVENTS_ORIGIN);
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
	return [];
}

export function meta() {
	return [
		{ title: 'Events - FoilCTF' },
		{ name: 'description', content: 'Browse all CTF events and competitions' },
	];
}
export async function loader({ request }: Route.LoaderArgs) {
	const session = await request_session(request);
	return data({ user: session.get('user') });
}
export default function Page({ loaderData}: Route.ComponentProps) {
	const { user } = loaderData;

	const [searchQuery, setSearchQuery] = useState('');
	const [activeFilter, setActiveFilter] = useState<'all' | EventStatus>('all');
	const [searchParams, setSearchParams] = useSearchParams();
	useEffect(() => {
		const idDebounce = setTimeout(() => {
			const newParams = new URLSearchParams(searchParams);
			if (searchQuery) {
				newParams.set('q', searchQuery);
			} else {
				newParams.delete('q');
			}
			newParams.delete('page');
			setSearchParams(newParams);
		}, 200);
		return (() => clearTimeout(idDebounce));
	}, [searchQuery]);
	useEffect(() => {
		const urlFilter = searchParams.get('filter');
		if (urlFilter && ['upcoming', 'active', 'ended'].includes(urlFilter)) {
			setActiveFilter(urlFilter as 'upcoming' | 'active' | 'ended');
		} else if (!urlFilter) {
			setActiveFilter('all');
		}
	}, [searchParams]);
	
	const [showCreateModal, setShowCreateModal] = useState(false);

	const searchTerm = searchParams.get('q') || '';
	const currentPage = parseInt(searchParams.get('page') || '1', 10);
	const itemsPerPage = parseInt(searchParams.get('perPage') || '9', 10);

	const query_events = useQuery({
		queryKey: ['events', { searchTerm, currentPage, itemsPerPage }],
		initialData: [],
		queryFn: async (context) => {
			return await remote_fetch_events(searchTerm, currentPage, itemsPerPage);
		},
	});

	const filteredEvents = mockEvents.filter((event) => {
		const matchesSearch = event.name
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesFilter =
			activeFilter === 'all' || event.status === activeFilter;
		return matchesSearch && matchesFilter;
	});

	const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

	const handlePageChange = (page: number) => {
		const newParams = new URLSearchParams(searchParams);
		newParams.set('page', page.toString());
		setSearchParams(newParams);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};
	const handleFilterChange = (value: string) => {
		setActiveFilter(value as typeof activeFilter);
		const newParams = new URLSearchParams(searchParams);
		newParams.delete('page');
		if (value === 'all') {
			newParams.delete('filter');
		} else {
			newParams.set('filter', value);
		}
		setSearchParams(newParams);
	};

	const counts = {
		all: mockEvents.length,
		upcoming: mockEvents.filter((e) => e.status === 'upcoming').length,
		active: mockEvents.filter((e) => e.status === 'active').length,
		ended: mockEvents.filter((e) => e.status === 'ended').length,
	};
	const filters = [
		{ id: 'all', label: 'All Events', count: counts.all },
		{ id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
		{ id: 'active', label: 'Active', count: counts.active },
		{ id: 'ended', label: 'Past Events', count: counts.ended },
	];
	return (
		<>
			<PageHeader
				title="Events"
				action={
					<Button
						onClick={() => setShowCreateModal(true)}
						aria-label="Create a new event"
					>
						<Icon name="add" className="size-4" aria-hidden={true} />
						New Event
					</Button>
				}
			/>
			<div className="flex flex-col gap-4 md:gap-6 min-w-0 w-full max-w-7xl mx-auto  px-4 py-8">
				<div className="b-6">
					<SearchInput
						value={searchQuery}
						onChange={(value: string) => setSearchQuery(value)}
						placeholder="Search events..."
					/>
				</div>

				<FilterTabs
					tabs={filters.map((f) => ({
						label: f.label,
						value: f.id,
						count: f.count,
					}))}
					activeTab={activeFilter}
					onChange={handleFilterChange}
				/>

				<div aria-live="polite" aria-atomic="true" className="sr-only">
					{filteredEvents.length} events found
				</div>

				{filteredEvents.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-muted">
							No events found matching your criteria.
						</p>
					</div>
				) : (
					<>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
							{paginatedEvents.map((event) => (
								<EventCard
									key={event.id}
									id={event.id}
									name={event.name}
									status={event.status}
									startDate={event.startDate}
									endDate={event.endDate}
									teamsCount={event.teams}
									maxTeams={event.maxTeams}
									organizer={event.organizer}
								/>
							))}
						</div>

						<Pagination
							currentPage={currentPage}
							totalPages={Math.max(1, totalPages)}
							onPageChange={handlePageChange}
							itemsPerPage={itemsPerPage}
							onItemsPerPageChange={(items) => {
								const newParams = new URLSearchParams(searchParams);
								newParams.set('perPage', items.toString());
								newParams.delete('page');
								setSearchParams(newParams);
							}}
							className="mt-8"
						/>
					</>
				)}
			</div>

			<AdminEventModal
				isOpen={showCreateModal}
				onClose={() => setShowCreateModal(false)}
			/>
		</>
	);
}
