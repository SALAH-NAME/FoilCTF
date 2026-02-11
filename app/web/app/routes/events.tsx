import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import PageHeader from '~/components/PageHeader';
import EventCard from '~/components/EventCard';
import SearchInput from '~/components/SearchInput';
import FilterTabs from '~/components/FilterTabs';
import type { Route } from './+types/events';

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

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Events - FoilCTF' },
		{ name: 'description', content: 'Browse all CTF events and competitions' },
	];
}

export default function Events() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [searchQuery, setSearchQuery] = useState('');

	const filterParam = searchParams.get('filter') as
		| 'upcoming'
		| 'active'
		| 'ended'
		| null;
	const [activeFilter, setActiveFilter] = useState<
		'all' | 'upcoming' | 'active' | 'ended'
	>(filterParam || 'all');

	useEffect(() => {
		const urlFilter = searchParams.get('filter');
		if (urlFilter && ['upcoming', 'active', 'ended'].includes(urlFilter)) {
			setActiveFilter(urlFilter as 'upcoming' | 'active' | 'ended');
		} else if (!urlFilter) {
			setActiveFilter('all');
		}
	}, [searchParams]);

	const handleFilterChange = (value: string) => {
		setActiveFilter(value as typeof activeFilter);
		if (value === 'all') {
			setSearchParams({});
		} else {
			setSearchParams({ filter: value });
		}
	};

	const filteredEvents = mockEvents.filter((event) => {
		const matchesSearch = event.name
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesFilter =
			activeFilter === 'all' || event.status === activeFilter;
		return matchesSearch && matchesFilter;
	});

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
		<div className="flex flex-col gap-4 md:gap-6 min-w-0 w-full">
			<PageHeader title="Events" />

			<div className="flex flex-col gap-3 md:gap-4">
				<SearchInput
					value={searchQuery}
					onChange={(value: string) => setSearchQuery(value)}
					placeholder="Search events..."
				/>

				<FilterTabs
					tabs={filters.map((f) => ({
						label: f.label,
						value: f.id,
						count: f.count,
					}))}
					activeTab={activeFilter}
					onChange={handleFilterChange}
				/>
			</div>

			<div aria-live="polite" aria-atomic="true" className="sr-only">
				{filteredEvents.length} events found
			</div>

			{filteredEvents.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-muted">No events found matching your criteria.</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
					{filteredEvents.map((event) => (
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
			)}
		</div>
	);
}
