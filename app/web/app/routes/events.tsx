import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { data, useSearchParams } from 'react-router';

import type { Route } from './+types/events';

import { request_session } from '~/session.server';

import Icon from '~/components/Icon';
import Button from '~/components/Button';
import EventCard from '~/components/EventCard';
import FilterTabs from '~/components/FilterTabs';
import Pagination from '~/components/Pagination';
import PageHeader from '~/components/PageHeader';
import SearchInput from '~/components/SearchInput';
import AdminEventModal from '~/components/AdminEventModal';
import Checkbox from '~/components/Checkbox';

const OEventStatus = {
	draft: 'draft',
	published: 'published',
	active: 'active',
	ended: 'ended',
} as const;

type EventStatus = keyof typeof OEventStatus;

export async function remote_fetch_events(q: string, status: 'all' | EventStatus, sort: 'asc' | 'desc', page: number, limit: number) {
	const url = new URL('/api/events', import.meta.env.BROWSER_REST_EVENTS_ORIGIN);
	if (q) url.searchParams.set('q', q);
	if (status !== 'all') url.searchParams.set('status', status.toString());
	url.searchParams.set('sort', sort.toString());
	url.searchParams.set('page', page.toString());
	url.searchParams.set('limit', limit.toString());

	const res = await fetch(url);
	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
	type JSONData_Events = {
		events: {
			id: number;
			name: string;
			team_members_min: number;
			team_members_max: number;
			metadata: Record<string, any>;
			start_time: string;
			end_time: string;
			status: 'draft' | 'published' | 'active' | 'ended';
			max_teams: number | null;
			teams_count: number;
		}[];
		count: number;
	};
	return json as JSONData_Events;
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
export default function Page({ loaderData }: Route.ComponentProps) {
	const { user } = loaderData;

	const [sortOldest, setSortOldest] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [activeFilter, setActiveFilter] = useState<'all' | EventStatus>('all');
	const [showCreateModal, setShowCreateModal] = useState(false);

	const [searchParams, setSearchParams] = useSearchParams();

	const searchTerm = searchParams.get('q') || '';
	const currentPage = Math.max(parseInt(searchParams.get('page') || '1'), 1);
	const itemsPerPage = Math.max(parseInt(searchParams.get('perPage') || '10'), 10);

	const query_events = useQuery({
		queryKey: ['events', { searchTerm, activeFilter, sortOldest, currentPage, itemsPerPage }],
		initialData: { events: [], count: 0 },
		queryFn: async () => {
			const sortOrder = sortOldest ? 'asc' : 'desc';
			return await remote_fetch_events(searchTerm, activeFilter, sortOrder, currentPage, itemsPerPage);
		},
	});
	const { data: { events, count: pagination_count_elements } } = query_events;

	// TODO(xenobas): Fix bug where `page` query parameter doesn't persist across refreshes
	// TODO(xenobas): Run over all of these and make them sourced from the database instead
	const pagination_count_pages = Math.max(1, Math.ceil(pagination_count_elements / itemsPerPage));

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
	const handleSortChange = (value: boolean) => {
		setSortOldest(value);

		const newParams = new URLSearchParams(searchParams);
		newParams.delete('page');
		if (value) {
			newParams.set('sort', 'asc');
		} else {
			newParams.delete('sort');
		}
		setSearchParams(newParams);
	};

	const filters = [
		{ id: 'all', label: 'All Events' },
		{ id: 'published', label: 'Upcoming' },
		{ id: 'active', label: 'Active' },
		{ id: 'ended', label: 'Past Events' },
	];

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
		const param_filter = searchParams.get('filter');
		const valid_filter = (param_filter && Object.keys(OEventStatus).includes(param_filter));
		if (!valid_filter) setActiveFilter('all');
		else setActiveFilter(param_filter as EventStatus);

		const param_sort = searchParams.get('sort');
		setSortOldest(param_sort === 'asc');
	}, [searchParams]);

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
					}))}
					activeTab={activeFilter}
					onChange={handleFilterChange}
				/>

				<Checkbox id="events-sort" label="Sort by Oldest" checked={sortOldest} setChecked={handleSortChange} />

				<div aria-live="polite" aria-atomic="true" className="sr-only">
					{events.length} events found
				</div>

				{events.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-muted">
							No events found matching your criteria.
						</p>
					</div>
				) : (
					<>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
							{events.map(event => (
								<EventCard
									key={event.id}
									id={event.id}
									name={event.name}
									status={event.status}
									startDate={event.start_time}
									endDate={event.end_time}
									teamsCount={event.teams_count}
									maxTeams={event.max_teams}
								/>
							))}
						</div>

						<Pagination
							totalPages={pagination_count_pages}
							currentPage={currentPage}
							itemsPerPage={itemsPerPage}

							onPageChange={handlePageChange}
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

			{
				user?.role === "admin" && 
				<AdminEventModal
					isOpen={showCreateModal}
					onClose={() => setShowCreateModal(false)}
				/>
			}
		</>
	);
}
