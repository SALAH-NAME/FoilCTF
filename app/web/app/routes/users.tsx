import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import PageHeader from '~/components/PageHeader';
import UserCard, { type FriendStatus } from '~/components/UserCard';
import SearchInput from '~/components/SearchInput';
import Pagination from '~/components/Pagination';
import type { Route } from './+types/users';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '~/contexts/ToastContext';
import { remote_send_friend_request } from './friends';
import { request_session } from '~/session.server';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Users' }];
}
export async function loader({ request }: Route.LoaderArgs) {
	const session = await request_session(request);
	return { userState: session.get('user') };
}

interface User {
	username: string;
	avatar: string;
	teamName: string;
	challengesSolved: number;
	totalPoints: number;
	friendStatus: FriendStatus;
}

async function remote_fetch_users(
	token: string | undefined,
	q: string,
	page: number,
	limit: number
) {
	const headers = new Headers();
	if (token)
		headers.set('Authorization', `Bearer ${token}`);

	const url = new URL('/api/users', import.meta.env.BROWSER_REST_USER_ORIGIN);
	if (q) url.searchParams.set('q', q);
	url.searchParams.set('page', page.toString());
	url.searchParams.set('limit', limit.toString());

	const res = await fetch(url, { headers });
	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
	type JSONData_User = {
		id: number;
		role: string;
		username: string;
		team_name: string | null;
		avatar: string | null;
		total_points: number | null;
		challenges_solved: number | null;
		friend_status: FriendStatus;
	};
	type JSONData_Users = {
		data: JSONData_User[];
		limit: number;
		page: number;
	};
	return json as JSONData_Users;
}
export default function Page({ loaderData }: Route.ComponentProps) {
	const { addToast } = useToast();
	const { userState } = loaderData;
	const token_access = userState?.token_access;

	const [queryTerm, setQueryTerm] = useState<string>('');
	const [searchParams, setSearchParams] = useSearchParams();
	useEffect(() => {
		const idDebounce = setTimeout(() => {
			const newParams = new URLSearchParams(searchParams);
			if (queryTerm) {
				newParams.set('q', queryTerm);
			} else {
				newParams.delete('q');
			}
			newParams.delete('page');
			setSearchParams(newParams);
		}, 200);
		return () => {
			clearTimeout(idDebounce);
		};
	}, [queryTerm]);

	const searchQuery = searchParams.get('q') || '';
	const currentPage = parseInt(searchParams.get('page') || '1', 10);
	const itemsPerPage = parseInt(searchParams.get('perPage') || '6', 10);

	const queryClient = useQueryClient();

	const query_users = useQuery({
		queryKey: [
			'users',
			{ token_access, searchQuery, currentPage, itemsPerPage },
		],
		initialData: [],
		queryFn: async ({ queryKey }) => {
			const [_queryKeyPrime, variables] = queryKey;
			if (typeof variables === 'string') return [];

			const { searchQuery, currentPage, itemsPerPage } = variables;
			const { data: users } = await remote_fetch_users(
				token_access,
				searchQuery,
				currentPage,
				itemsPerPage
			);
			return users;
		},
	});
	const mut_friend_request_send = useMutation<unknown, Error, string>({
		mutationFn: async (target) => {
			if (!token_access)
				throw new Error('Unauthorized');
			await remote_send_friend_request(token_access, target);
			await queryClient.invalidateQueries({ queryKey: ['users'] });
		},
		onSuccess() {
			addToast({
				variant: 'success',
				title: 'Friend request sent',
				message: '',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Friend request not sent',
				message: err.message,
			});
		},
	});

	useEffect(() => {
		if (!query_users.error) return;
		addToast({
			variant: 'error',
			title: 'Users query failed',
			message: query_users.error.message,
		});
	}, [query_users.errorUpdateCount, query_users.errorUpdatedAt]);

	const filtered_users = query_users.data.map((user) => ({
		username: user.username,
		teamName: user.team_name || '',

		avatar: user.avatar || '',
		challengesSolved: user.challenges_solved || 0,
		totalPoints: user.total_points || 0,

		friendStatus: user.friend_status,
	})) satisfies User[];

	// Pagination
	const totalPages = Math.ceil(filtered_users.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedUsers = filtered_users.slice(
		startIndex,
		startIndex + itemsPerPage
	);

	const handlePageChange = (page: number) => {
		const newParams = new URLSearchParams(searchParams);
		newParams.set('page', page.toString());
		setSearchParams(newParams);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};
	const handleAddFriend = (target: string) => {
		mut_friend_request_send.mutate(target);
	};
	return (
		<>
			<PageHeader title="Find Users" />

			<main
				id="main-content"
				className="max-w-7xl mx-auto px-4 py-8 flex flex-col"
			>
				<div className="mb-6">
					<SearchInput
						value={queryTerm}
						onChange={setQueryTerm}
						placeholder="Search users by username..."
						aria-label="Search for users by username"
					/>
				</div>

				{query_users.isLoading ? (
					<div
						className="text-center py-12"
						role="status"
						aria-live="polite"
						aria-atomic="true"
					>
						<p className="text-dark/60 text-lg">Searching...</p>
					</div>
				) : filtered_users.length === 0 ? (
					<div
						className="text-center py-12"
						role="status"
						aria-live="polite"
						aria-atomic="true"
					>
						<p className="text-dark/60 text-lg">
							No users found matching "{searchQuery}"
						</p>
					</div>
				) : (
					<>
						<div
							className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
							role="list"
							aria-label="Search results"
						>
							{paginatedUsers.map((user) => (
								<div key={user.username} role="listitem">
									<UserCard
										{...user}
										userState={userState}
										disabled={mut_friend_request_send.isPending}
										onAddFriend={() => handleAddFriend(user.username)}
									/>
								</div>
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
							className="mt-auto"
						/>
					</>
				)}

				{searchQuery && (
					<div className="sr-only" role="status" aria-live="polite">
						{filtered_users.length} user
						{filtered_users.length !== 1 ? 's' : ''} found
					</div>
				)}
			</main>
		</>
	);
}
