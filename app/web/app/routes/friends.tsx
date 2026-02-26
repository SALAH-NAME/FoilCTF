import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { useEffect, useState } from 'react';

import type { Route } from './+types/friends';

import PageHeader from '~/components/PageHeader';
import FriendCard from '~/components/FriendCard';
import FilterTabs from '~/components/FilterTabs';
import SearchInput from '~/components/SearchInput';
import Pagination from '~/components/Pagination';
import { useUserAuth } from '~/contexts/UserContext';
import { useToast } from '~/contexts/ToastContext';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Friends' }];
}

interface Friend {
	username: string;
	avatar?: string;
	teamName?: string;
	challengesSolved: number;
	totalPoints: number;
}

export async function remote_fetch_friends(
	token: string,
	q: string,
	page: number,
	limit: number
) {
	const url = new URL('/api/friends', import.meta.env.BROWSER_REST_USER_ORIGIN);
	if (q) url.searchParams.set('q', q);
	url.searchParams.set('page', page.toString());
	url.searchParams.set('limit', limit.toString());

	const res = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
	type JSONData_Friends = {
		data: string[];
		limit: number;
		page: number;
	};
	return json as JSONData_Friends;
}
export async function remote_remove_friend(token: string, target: string) {
	const url = new URL(
		'/api/friends/' + target,
		import.meta.env.BROWSER_REST_USER_ORIGIN
	);

	const res = await fetch(url, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
}

export async function remote_fetch_friend_requests(
	token: string,
	q: string,
	page: number,
	limit: number
) {
	const url = new URL(
		'/api/friends/requests',
		import.meta.env.BROWSER_REST_USER_ORIGIN
	);
	if (q) url.searchParams.set('q', q);
	url.searchParams.set('page', page.toString());
	url.searchParams.set('limit', limit.toString());

	const res = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
	type JSONData_Friends = {
		data: { sender_name: string; receiver_name: string }[];
		limit: number;
		page: number;
	};
	return json as JSONData_Friends;
}
export async function remote_send_friend_request(
	token: string,
	target: string
) {
	const url = new URL(
		'/api/friends/requests/' + target,
		import.meta.env.BROWSER_REST_USER_ORIGIN
	);

	const res = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
}
export async function remote_cancel_friend_request(
	token: string,
	target: string
) {
	const url = new URL(
		'/api/friends/requests/' + target,
		import.meta.env.BROWSER_REST_USER_ORIGIN
	);

	const res = await fetch(url, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
}
export async function remote_accept_friend_request(
	token: string,
	target: string
) {
	const url = new URL(
		'/api/friends/requests/pending/' + target,
		import.meta.env.BROWSER_REST_USER_ORIGIN
	);

	const res = await fetch(url, {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
}
export async function remote_refuse_friend_request(
	token: string,
	target: string
) {
	const url = new URL(
		'/api/friends/requests/pending/' + target,
		import.meta.env.BROWSER_REST_USER_ORIGIN
	);

	const res = await fetch(url, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
}

export default function Page() {
	const { userState: user } = useUserAuth();
	const { token_access } = user;

	const [queryTerm, setQueryTerm] = useState<string>('');
	const [searchParams, setSearchParams] = useSearchParams();

	const activeTab = (searchParams.get('tab') || 'friends') as
		| 'friends'
		| 'received'
		| 'sent';
	const searchQuery = searchParams.get('q') || '';
	const currentPage = parseInt(searchParams.get('page') || '1', 10);
	const itemsPerPage = parseInt(searchParams.get('perPage') || '6', 10);
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

	const queryClient = useQueryClient();
	const { addToast } = useToast();

	const query_friends = useQuery({
		queryKey: [
			'friends',
			{ token_access, searchQuery, currentPage, itemsPerPage },
		],
		initialData: [],
		queryFn: async ({ queryKey }) => {
			const [_queryKeyPrime, variables] = queryKey;
			if (typeof variables === 'string') return [];

			const { searchQuery, currentPage, itemsPerPage } = variables;
			const { data: friends } = await remote_fetch_friends(
				token_access,
				searchQuery,
				currentPage,
				itemsPerPage
			);
			return friends;
		},
	});
	const query_requests = useQuery({
		queryKey: [
			'friends-requests',
			{ token_access, searchQuery, currentPage, itemsPerPage },
		],
		initialData: [],
		queryFn: async ({ queryKey }) => {
			const [_queryKeyPrime, variables] = queryKey;
			if (typeof variables === 'string') return [];

			const { searchQuery, currentPage, itemsPerPage } = variables;
			const { data: friends } = await remote_fetch_friend_requests(
				token_access,
				searchQuery,
				currentPage,
				itemsPerPage
			);
			return friends;
		},
	});
	const mut_friend_remove = useMutation<unknown, Error, string>({
		mutationFn: async (target) => {
			await remote_remove_friend(token_access, target);
			await queryClient.invalidateQueries({ queryKey: ['friends'] });
		},
		onSuccess() {
			addToast({
				variant: 'success',
				title: 'User unfriended',
				message: '',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'User unfriend',
				message: err.message,
			});
		},
	});
	const mut_friend_request_cancel = useMutation<unknown, Error, string>({
		mutationFn: async (target) => {
			await remote_cancel_friend_request(token_access, target);
			await queryClient.invalidateQueries({ queryKey: ['friends-requests'] });
		},
		onSuccess() {
			addToast({
				variant: 'success',
				title: 'Friend request cancel',
				message: '',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Friend request cancel',
				message: err.message,
			});
		},
	});
	const mut_friend_request_accept = useMutation<unknown, Error, string>({
		mutationFn: async (target) => {
			await remote_accept_friend_request(token_access, target);
			await queryClient.invalidateQueries({ queryKey: ['friends-requests'] });
			await queryClient.invalidateQueries({ queryKey: ['friends'] });
		},
		onSuccess() {
			addToast({
				variant: 'success',
				title: 'Friend request accepted',
				message: '',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Friend request accept',
				message: err.message,
			});
		},
	});
	const mut_friend_request_refuse = useMutation<unknown, Error, string>({
		mutationFn: async (target) => {
			await remote_refuse_friend_request(token_access, target);
			await queryClient.invalidateQueries({ queryKey: ['friends-requests'] });
			await queryClient.invalidateQueries({ queryKey: ['friends'] });
		},
		onSuccess() {
			addToast({
				variant: 'success',
				title: 'Friend request refused',
				message: '',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Friend request refuse',
				message: err.message,
			});
		},
	});

	const handleRemoveFriend = (target: string) => {
		mut_friend_remove.mutate(target);
	};
	const handleAcceptRequest = (target: string) => {
		mut_friend_request_accept.mutate(target);
	};
	const handleRefuseRequest = (target: string) => {
		mut_friend_request_refuse.mutate(target);
	};
	const handleCancelRequest = (target: string) => {
		mut_friend_request_cancel.mutate(target);
	};

	const tabs = [
		{
			id: 'friends',
			value: 'friends',
			label: 'Friends',
			count: query_friends.data.length,
		},
		{
			id: 'received',
			value: 'received',
			label: 'Received',
			count: 0,
		},
		{
			id: 'sent',
			value: 'sent',
			label: 'Sent',
			count: 0,
		},
	];

	const filteredSent: Friend[] = query_requests.data
		.filter(({ sender_name: username }) => username === user.username)
		.map(({ receiver_name: username }) => ({
			username,
			challengesSolved: 0,
			totalPoints: 0,
		})); // getFilteredData(friendsData.received);
	const filteredFriends: Friend[] = query_friends.data.map((username) => ({
		username,
		challengesSolved: 0,
		totalPoints: 0,
	})); // getFilteredData(friendsData.friends);
	const filteredReceived: Friend[] = query_requests.data
		.filter(({ receiver_name: username }) => username === user.username)
		.map(({ sender_name: username }) => ({
			username,
			challengesSolved: 0,
			totalPoints: 0,
		})); // getFilteredData(friendsData.received);

	const getPaginatedData = (data: Friend[]) => {
		const totalPages = Math.ceil(data.length / itemsPerPage);
		const startIndex = (currentPage - 1) * itemsPerPage;
		return {
			items: data.slice(startIndex, startIndex + itemsPerPage),
			totalPages,
		};
	};

	const handlePageChange = (page: number) => {
		const newParams = new URLSearchParams(searchParams);
		newParams.set('page', page.toString());
		setSearchParams(newParams);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<>
			<PageHeader title="Friends" />

			<main
				id="main-content"
				className="max-w-5xl mx-auto px-4 py-8 flex flex-col h-full"
			>
				<div className="mb-6">
					<SearchInput
						value={queryTerm}
						onChange={setQueryTerm}
						placeholder="Search by username..."
						aria-label="Search friends by username"
					/>
				</div>

				<FilterTabs
					tabs={tabs}
					activeTab={activeTab}
					onChange={(tab) => {
						const newParams = new URLSearchParams(searchParams);
						newParams.set('tab', tab);
						newParams.delete('page');
						newParams.delete('q');
						setSearchParams(newParams);
					}}
				/>

				{activeTab === 'friends' &&
					(() => {
						const { items, totalPages } = getPaginatedData(filteredFriends);
						return (
							<section
								aria-labelledby="friends-heading"
								className="mt-6 h-full flex flex-col"
							>
								<h2 id="friends-heading" className="sr-only">
									Friends list
								</h2>
								{query_friends.data.length === 0 ? (
									<div
										className="bg-white/70 rounded-md p-8 border border-dark/10 text-center"
										role="status"
										aria-live="polite"
									>
										<p className="text-dark/60">
											You don't have any friends yet. Start by searching for
											users!
										</p>
									</div>
								) : filteredFriends.length === 0 ? (
									<div
										className="bg-white/70 rounded-md p-8 border border-dark/10 text-center"
										role="status"
										aria-live="polite"
									>
										<p className="text-dark/60">
											No friends found matching "{searchQuery}"
										</p>
									</div>
								) : (
									<>
										<div
											className="space-y-4 mb-8"
											role="list"
											aria-label="Friends list"
										>
											{items.map((friend) => (
												<div key={friend.username} role="listitem">
													<FriendCard
														{...friend}
														type="friend"
														onRemove={() => handleRemoveFriend(friend.username)}
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
											className="mt-auto mb-12"
										/>
									</>
								)}
							</section>
						);
					})()}

				{activeTab === 'received' &&
					(() => {
						const { items, totalPages } = getPaginatedData(filteredReceived);
						return (
							<section
								aria-labelledby="received-heading"
								className="mt-6 h-full flex flex-col"
							>
								<h2 id="received-heading" className="sr-only">
									Received friend requests
								</h2>
								{query_requests.data.length === 0 ? (
									<div
										className="bg-white/70 rounded-md p-8 border border-dark/10 text-center"
										role="status"
										aria-live="polite"
									>
										<p className="text-dark/60">No pending friend requests.</p>
									</div>
								) : filteredReceived.length === 0 ? (
									<div
										className="bg-white/70 rounded-md p-8 border border-dark/10 text-center"
										role="status"
										aria-live="polite"
									>
										<p className="text-dark/60">
											No received requests found matching "{searchQuery}"
										</p>
									</div>
								) : (
									<>
										<div
											className="space-y-4 mb-8"
											role="list"
											aria-label="Received friend requests"
										>
											{items.map((request) => (
												<div key={request.username} role="listitem">
													<FriendCard
														{...request}
														type="received"
														onAccept={() =>
															handleAcceptRequest(request.username)
														}
														onReject={() =>
															handleRefuseRequest(request.username)
														}
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
											className="mt-auto mb-12"
										/>
									</>
								)}
							</section>
						);
					})()}

				{activeTab === 'sent' &&
					(() => {
						const { items, totalPages } = getPaginatedData(filteredSent);
						return (
							<section
								aria-labelledby="sent-heading"
								className="mt-6 h-full flex flex-col"
							>
								<h2 id="sent-heading" className="sr-only">
									Sent friend requests
								</h2>
								{query_requests.data.length === 0 ? (
									<div
										className="bg-white/70 rounded-md p-8 border border-dark/10 text-center"
										role="status"
										aria-live="polite"
									>
										<p className="text-dark/60">No pending sent requests.</p>
									</div>
								) : filteredSent.length === 0 ? (
									<div
										className="bg-white/70 rounded-md p-8 border border-dark/10 text-center"
										role="status"
										aria-live="polite"
									>
										<p className="text-dark/60">
											No sent requests found matching "{searchQuery}"
										</p>
									</div>
								) : (
									<>
										<div
											className="space-y-4 mb-8"
											role="list"
											aria-label="Sent friend requests"
										>
											{items.map((request) => (
												<div key={request.username} role="listitem">
													<FriendCard
														{...request}
														type="sent"
														onCancel={() =>
															handleCancelRequest(request.username)
														}
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
											className="mt-auto mb-12"
										/>
									</>
								)}
							</section>
						);
					})()}

				<div className="sr-only" role="status" aria-live="polite">
					{activeTab === 'friends' &&
						`${filteredFriends.length} friend${filteredFriends.length !== 1 ? 's' : ''}`}
					{activeTab === 'received' &&
						`${filteredReceived.length} received request${filteredReceived.length !== 1 ? 's' : ''}`}
					{activeTab === 'sent' &&
						`${filteredSent.length} sent request${filteredSent.length !== 1 ? 's' : ''}`}
				</div>
			</main>
		</>
	);
}
