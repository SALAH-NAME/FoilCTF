import {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from 'react';

type NotificationType =
	| 'event'
	| 'team'
	| 'friend'
	| 'challenge'
	| 'achievement'
	| 'system';

interface Notification {
	id: string;
	type: NotificationType;
	title: string;
	message: string;
	timestamp: string;
	read: boolean;
	link?: string;
}

const notificationsMockData: Notification[] = [
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
	{
		id: '8',
		type: 'challenge',
		title: 'Challenge Solved',
		message: 'You solved "Buffer Overflow Basics" and earned 200 pts!',
		timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
		read: false,
		link: '/profile',
	},
	{
		id: '9',
		type: 'team',
		title: 'Team Invitation',
		message: 'You have been invited to join "NullPointers".',
		timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
		read: false,
		link: '/team/invitations',
	},
	{
		id: '10',
		type: 'friend',
		title: 'Friend Accepted',
		message: 'cyberfox accepted your friend request.',
		timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
		read: true,
		link: '/friends',
	},
	{
		id: '11',
		type: 'system',
		title: 'Password Expiry Notice',
		message: 'Your password will expire in 5 days. Please update it.',
		timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
		read: false,
		link: '/settings/security',
	},
	{
		id: '12',
		type: 'achievement',
		title: 'Milestone Reached',
		message: 'Congratulations! You reached 1000 total points.',
		timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
		read: false,
		link: '/profile',
	},
];

export type { Notification, NotificationType };

interface NotificationContextType {
	notifications: Notification[];
	unreadCount: number;
	isPanelOpen: boolean;
	openPanel: () => void;
	closePanel: () => void;
	togglePanel: () => void;
	markAsRead: (id: string) => void;
	markAllAsRead: () => void;
	dismiss: (id: string) => void;
	clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
	undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
	const [notifications, setNotifications] = useState<Notification[]>(
		notificationsMockData
	);
	const [isPanelOpen, setIsPanelOpen] = useState(false);

	const unreadCount = notifications.filter((n) => !n.read).length;

	const openPanel = useCallback(() => setIsPanelOpen(true), []);
	const closePanel = useCallback(() => setIsPanelOpen(false), []);
	const togglePanel = useCallback(() => setIsPanelOpen((prev) => !prev), []);

	const markAsRead = useCallback((id: string) => {
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, read: true } : n))
		);
	}, []);

	const markAllAsRead = useCallback(() => {
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
	}, []);

	const dismiss = useCallback((id: string) => {
		setNotifications((prev) => prev.filter((n) => n.id !== id));
	}, []);

	const clearAll = useCallback(() => {
		setNotifications([]);
	}, []);

	return (
		<NotificationContext.Provider
			value={{
				notifications,
				unreadCount,
				isPanelOpen,
				openPanel,
				closePanel,
				togglePanel,
				markAsRead,
				markAllAsRead,
				dismiss,
				clearAll,
			}}
		>
			{children}
		</NotificationContext.Provider>
	);
}

export function useNotification() {
	const context = useContext(NotificationContext);
	if (!context)
		throw new Error('useNotification must be used within NotificationProvider');
	return context;
}
