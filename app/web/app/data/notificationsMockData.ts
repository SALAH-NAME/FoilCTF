export type NotificationType =
	| 'event'
	| 'team'
	| 'friend'
	| 'challenge'
	| 'achievement'
	| 'system';

export interface Notification {
	id: string;
	type: NotificationType;
	title: string;
	message: string;
	timestamp: string;
	read: boolean;
	link?: string;
}

export const notificationsMockData: Notification[] = [
	{
		id: '1',
		type: 'event',
		title: 'CTF Event Starting Soon',
		message: 'Winter Hack 2026 begins in 30 minutes. Get ready!',
		timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
		read: false,
		link: '/events/1',
	},
	{
		id: '2',
		type: 'challenge',
		title: 'New Challenge Released',
		message:
			'"Kernel Panic" — a hard pwn challenge worth 500 pts has been added.',
		timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		read: false,
		link: '/challenges',
	},
	{
		id: '3',
		type: 'team',
		title: 'Team Join Request',
		message: 'xenobas wants to join your team "ByteBusters".',
		timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
		read: false,
		link: '/team',
	},
	{
		id: '4',
		type: 'achievement',
		title: 'Achievement Unlocked',
		message:
			'You earned the "First Blood" badge for solving a challenge first!',
		timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
		read: false,
		link: '/profile',
	},
	{
		id: '5',
		type: 'friend',
		title: 'Friend Request',
		message: 'l33thax0r sent you a friend request.',
		timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
		read: true,
		link: '/friends',
	},
	{
		id: '6',
		type: 'event',
		title: 'Event Results Published',
		message: 'Summer CTF 2025 results are in. Your team placed #3!',
		timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		read: true,
		link: '/events/5/leaderboard',
	},
	{
		id: '7',
		type: 'system',
		title: 'Scheduled Maintenance',
		message:
			'The platform will be down for maintenance on Feb 25 at 03:00 UTC.',
		timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
		read: true,
	},
];
