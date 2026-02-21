import { useState } from 'react';
import type { Route } from './+types/profile';
import Button from '../components/Button';
import StatsCard from '../components/StatsCard';
import Icon from '~/components/Icon';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Profile' }];
}

export default function Page() {
	// TODO: Replace API

	const [profileData, setProfileData] = useState({
		username: 'John_Doe',
		avatar: '',
		email: 'john@example.com',
		challengesSolved: 11,
		eventsParticipated: 6,
		totalPoints: 1250,
		bio: 'Seasoned CTF player with 5+ years grinding jeopardy and attack/defense formats. Rating: 2600+ on CTFtime (top 5%). Solo & team wins at DEF CON "25, HackTheVote "24. Specialize in pwn (ROP chains, heap feng shui), crypto (lattice attacks, side-channels), rev (Ghidra/IDA wizardry).',
		location: 'New York, USA',
		link: 'https://github.com/johndoe',
		isPrivateProfile: false,
	});

	const [friendStatus, setFriendStatus] = useState<
		'none' | 'pending' | 'friends'
	>('none');

	const handleAddFriend = () => {
		// TODO: Implement API call
		setFriendStatus('pending');
		console.log('Sending friend request to:', profileData.username);
	};

	const handleCancelRequest = () => {
		// TODO: Implement API call
		setFriendStatus('none');
		console.log('Canceling friend request to:', profileData.username);
	};

	return (
		<div className="h-full bg-background p-4">
			<div className="max-w-4xl mx-auto space-y-6">
				<div className="bg-white rounded-md border border-dark/10">
					<div className="md:block flex h-32 md:h-40 px-6 justify-center bg-linear-to-r from-primary to-secondary rounded-t-sm">
						<div className="absolute ring-4 ring-white rounded-full translate-y-1/2">
							<div className="relative group">
								<div
									className={`w-32 h-32 md:w-40 md:h-40 bg-secondary rounded-full flex items-center justify-center shrink-0 overflow-hidden relative focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none`}
									role="button"
									aria-label={`Upload ${profileData.username}'s avatar`}
									tabIndex={0}
								>
									{false ? (
										<img
											src="#"
											alt={`${profileData.username}'s avatar`}
											className="w-full h-full object-cover"
										/>
									) : (
										<span className="text-5xl md:text-6xl font-bold text-white">
											{profileData.username.charAt(0).toUpperCase()}
										</span>
									)}
								</div>
							</div>
						</div>
					</div>
					<div className="px-6 md:px-8 pb-6 md:pb-8 flex items-center flex-col">
						<div className="flex flex-col md:flex-row items-center md:items-end gap-6">
							<div className="flex-1 text-center md:text-left md:pb-2 md:mt-4 mt-16 md:ml-44 ">
								<h1 className="text-3xl md:text-4xl font-bold text-dark mb-1">
									{profileData.username}
								</h1>
								{profileData.bio && (
									<p className="text-dark/70 mb-3 max-w-2xl text-sm">
										{profileData.bio}
									</p>
								)}
								<div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-dark/60">
									{profileData.location && (
										<span className="flex items-center gap-1">
											<Icon
												name="location"
												className="size-4 shrink-0"
												aria-hidden={true}
											/>
											<span>{profileData.location}</span>
										</span>
									)}
									{profileData.link && (
										<p
											rel="noopener noreferrer"
											className="flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
										>
											<Icon
												name="link"
												className="size-4 shrink-0"
												aria-hidden={true}
											/>
											<span className="truncate max-w-xs">
												{profileData.link}
											</span>
										</p>
									)}
								</div>
							</div>
						</div>
						<div className="flex gap-3 mt-4 h-10 md:ml-auto md:mr-0">
							{friendStatus === 'none' && (
								<Button
									variant="primary"
									onClick={handleAddFriend}
									aria-label={`Send friend request to ${profileData.username}`}
								>
									Add Friend
								</Button>
							)}
							{friendStatus === 'pending' && (
								<Button
									variant="secondary"
									onClick={handleCancelRequest}
									aria-label={`Cancel friend request to ${profileData.username}`}
								>
									Cancel Request
								</Button>
							)}
							{friendStatus === 'friends' && (
								<div className="flex items-center gap-2 text-primary">
									<Icon name="check" className="size-5" aria-hidden={true} />
									<span className="font-semibold">Friends</span>
								</div>
							)}
						</div>
					</div>
				</div>

				<div
					className="grid grid-cols-1 md:grid-cols-3 gap-4"
					role="region"
					aria-label="Profile Statistics"
				>
					<StatsCard
						value={profileData.challengesSolved}
						label="Challenges Solved"
					/>
					<StatsCard
						value={profileData.eventsParticipated}
						label="Events Participated In"
					/>
					<StatsCard value={profileData.totalPoints} label="Total Points" />
				</div>
			</div>
		</div>
	);
}
