import { useState } from 'react';
import { useSearchParams } from 'react-router';
import PageHeader from '~/components/PageHeader';
import UserCard from '~/components/UserCard';
import SearchInput from '~/components/SearchInput';
import Pagination from '~/components/Pagination';
import type { Route } from './+types/users';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Users' }];
}

interface User {
	username: string;
	avatar?: string;
	teamName?: string;
	challengesSolved: number;
	totalPoints: number;
	friendStatus: 'none' | 'pending' | 'friends';
}

// Mock data - Replace
const mockUsers: User[] = [
	{
		username: 'Alice_CTF',
		teamName: 'Cyber Warriors',
		challengesSolved: 45,
		totalPoints: 2100,
		friendStatus: 'none',
	},
	{
		username: 'Bob_Hacker',
		teamName: 'Binary Bandits',
		challengesSolved: 52,
		totalPoints: 2450,
		friendStatus: 'friends',
	},
	{
		username: 'Charlie_Sec',
		teamName: 'Shell Shockers',
		challengesSolved: 38,
		totalPoints: 1680,
		friendStatus: 'pending',
	},
	{
		username: 'Diana_Rev',
		teamName: 'Cyber Warriors',
		challengesSolved: 28,
		totalPoints: 1100,
		friendStatus: 'none',
	},
	{
		username: 'Eve_Cipher',
		teamName: 'Crypto Crew',
		challengesSolved: 31,
		totalPoints: 1420,
		friendStatus: 'none',
	},
	{
		username: 'Frank_Pwn',
		teamName: 'Pwn Masters',
		challengesSolved: 61,
		totalPoints: 3200,
		friendStatus: 'none',
	},
];

export default function Page() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [users, setUsers] = useState<User[]>(mockUsers);
	const [isSearching, setIsSearching] = useState(false);

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
		if (query.length > 0) {
			setIsSearching(true);
			// TODO: Implement
			setTimeout(() => {
				setIsSearching(false);
			}, 300);
		} else {
			setIsSearching(false);
		}
	};

	const filteredUsers = searchQuery
		? users.filter((user) =>
				user.username.toLowerCase().includes(searchQuery.toLowerCase())
			)
		: [];

	// Pagination
	const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedUsers = filteredUsers.slice(
		startIndex,
		startIndex + itemsPerPage
	);

	const handlePageChange = (page: number) => {
		const newParams = new URLSearchParams(searchParams);
		newParams.set('page', page.toString());
		setSearchParams(newParams);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const handleAddFriend = (username: string) => {
		// TODO: Implement
		setUsers((prev) =>
			prev.map((user) =>
				user.username === username
					? { ...user, friendStatus: 'pending' as const }
					: user
			)
		);
		console.log('Sending friend request to:', username);
	};

	const handleCancelRequest = (username: string) => {
		// TODO: Implement
		setUsers((prev) =>
			prev.map((user) =>
				user.username === username
					? { ...user, friendStatus: 'none' as const }
					: user
			)
		);
		console.log('Canceling friend request to:', username);
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
						value={searchQuery}
						onChange={handleSearch}
						placeholder="Search users by username..."
						aria-label="Search for users by username"
					/>
				</div>

				{!searchQuery ? (
					<div
						className="text-center py-12"
						role="status"
						aria-live="polite"
						aria-atomic="true"
					>
						<p className="text-dark/60 text-lg">
							Start typing to search for users
						</p>
					</div>
				) : isSearching ? (
					<div
						className="text-center py-12"
						role="status"
						aria-live="polite"
						aria-atomic="true"
					>
						<p className="text-dark/60 text-lg">Searching...</p>
					</div>
				) : filteredUsers.length === 0 ? (
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
										onAddFriend={
											user.friendStatus === 'none'
												? () => handleAddFriend(user.username)
												: undefined
										}
										onCancelRequest={
											user.friendStatus === 'pending'
												? () => handleCancelRequest(user.username)
												: undefined
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
							className="mt-auto"
						/>
					</>
				)}

				{searchQuery && (
					<div className="sr-only" role="status" aria-live="polite">
						{filteredUsers.length} user
						{filteredUsers.length !== 1 ? 's' : ''} found
					</div>
				)}
			</main>
		</>
	);
}
