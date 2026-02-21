import { useState } from 'react';
import { useSearchParams } from 'react-router';
import PageHeader from '~/components/PageHeader';
import FriendCard from '~/components/FriendCard';
import FilterTabs from '~/components/FilterTabs';
import SearchInput from '~/components/SearchInput';
import Pagination from '~/components/Pagination';
import type { Route } from './+types/friends';

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

// Mock data - Replace
const mockData = {
	friends: [
		{
			username: 'Bob_Hacker',
			teamName: 'Binary Bandits',
			challengesSolved: 52,
			totalPoints: 2450,
		},
		{
			username: 'Charlie_Sec',
			teamName: 'Shell Shockers',
			challengesSolved: 38,
			totalPoints: 1680,
		},
		{
			username: 'Diana_Rev',
			teamName: 'Cyber Warriors',
			challengesSolved: 28,
			totalPoints: 1100,
		},
	] as Friend[],
	received: [
		{
			username: 'Eve_Cipher',
			teamName: 'Crypto Crew',
			challengesSolved: 31,
			totalPoints: 1420,
		},
		{
			username: 'Frank_Pwn',
			teamName: 'Pwn Masters',
			challengesSolved: 61,
			totalPoints: 3200,
		},
	] as Friend[],
	sent: [
		{
			username: 'Grace_Web',
			teamName: 'Web Warriors',
			challengesSolved: 44,
			totalPoints: 1980,
		},
	] as Friend[],
};

export default function Page() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [friendsData, setFriendsData] = useState(mockData);

	const activeTab = (searchParams.get('tab') || 'friends') as
		| 'friends'
		| 'received'
		| 'sent';
	const searchQuery = searchParams.get('q') || '';
	const currentPage = parseInt(searchParams.get('page') || '1', 10);
	const itemsPerPage = parseInt(searchParams.get('perPage') || '6', 10);

	const handleSearch = (query: string) => {
		const newParams = new URLSearchParams(searchParams);
		if (query) {
			newParams.set('q', query);
		} else {
			newParams.delete('q');
		}
		newParams.delete('page');
		setSearchParams(newParams);
	};

	const handleRemoveFriend = (username: string) => {
		// TODO: Implement
		console.log('Removing friend:', username);
		setFriendsData((prev) => ({
			...prev,
			friends: prev.friends.filter((f) => f.username !== username),
		}));
	};

	const handleAcceptRequest = (username: string) => {
		// TODO: Implement
		console.log('Accepting friend request from:', username);
		const request = friendsData.received.find((r) => r.username === username);
		if (request) {
			setFriendsData((prev) => ({
				...prev,
				friends: [...prev.friends, request],
				received: prev.received.filter((r) => r.username !== username),
			}));
		}
	};

	const handleRejectRequest = (username: string) => {
		// TODO: Implement
		console.log('Rejecting friend request from:', username);
		setFriendsData((prev) => ({
			...prev,
			received: prev.received.filter((r) => r.username !== username),
		}));
	};

	const handleCancelRequest = (username: string) => {
		// TODO: Implement
		console.log('Canceling friend request to:', username);
		setFriendsData((prev) => ({
			...prev,
			sent: prev.sent.filter((r) => r.username !== username),
		}));
	};

	const tabs = [
		{
			id: 'friends',
			value: 'friends',
			label: 'Friends',
			count: friendsData.friends.length,
		},
		{
			id: 'received',
			value: 'received',
			label: 'Received',
			count: friendsData.received.length,
		},
		{
			id: 'sent',
			value: 'sent',
			label: 'Sent',
			count: friendsData.sent.length,
		},
	];

	const getFilteredData = (data: Friend[]) => {
		if (!searchQuery) return data;
		return data.filter((item) =>
			item.username.toLowerCase().includes(searchQuery.toLowerCase())
		);
	};

	const filteredFriends = getFilteredData(friendsData.friends);
	const filteredReceived = getFilteredData(friendsData.received);
	const filteredSent = getFilteredData(friendsData.sent);

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
						value={searchQuery}
						onChange={handleSearch}
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
								{friendsData.friends.length === 0 ? (
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
								{friendsData.received.length === 0 ? (
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
															handleRejectRequest(request.username)
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
								{friendsData.sent.length === 0 ? (
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
