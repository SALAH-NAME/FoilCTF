import {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
	useEffect,
} from 'react';
import { useNotificationSocketProvider } from './WebSocketContext';

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

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
	type NotificationsState = {
		elements: Notification[];
		last_index: number;
	};
	const [notificationsState, setNotificationsState] =
		useState<NotificationsState>({ elements: [], last_index: 0 });
	const unreadCount = notificationsState.elements.filter(
		({ read }) => !read
	).length;

	const [isPanelOpen, setIsPanelOpen] = useState(false);
	const openPanel = useCallback(() => setIsPanelOpen(true), []);
	const closePanel = useCallback(() => setIsPanelOpen(false), []);
	const togglePanel = useCallback(() => setIsPanelOpen((prev) => !prev), []);

	const markAsRead = useCallback((id: string) => {
		setNotificationsState(({ elements, last_index }) => {
			return {
				elements: elements.map((n) => (n.id === id ? { ...n, read: true } : n)),
				last_index,
			};
		});
	}, []);
	const markAllAsRead = useCallback(() => {
		setNotificationsState(({ elements, last_index }) => {
			return {
				elements: elements.map((n) => ({ ...n, read: true })),
				last_index,
			};
		});
	}, []);
	const dismiss = useCallback((id: string) => {
		setNotificationsState(({ elements, last_index }) => {
			return {
				elements: elements.filter((n) => n.id !== id),
				last_index,
			};
		});
	}, []);
	const clearAll = useCallback(() => {
		setNotificationsState(({ last_index }) => {
			return {
				elements: [],
				last_index,
			};
		});
	}, []);

	const { messages } = useNotificationSocketProvider();
	const [_lastMessageIndex, setLastMessageIndex] = useState(0);
	useEffect(() => {
		setNotificationsState(({ elements, last_index }) => {
			const elements_new: Notification[] = [];
			for (const { metadata } of messages.slice(last_index)) {
				const { id } = metadata;
				const notification = {
					...metadata,
					id: id.toString(),
					read: metadata.is_read,
					timestamp: new Date(metadata.created_at).toISOString(),
				};

				elements_new.push(notification);
			}

			return {
				elements: [...elements, ...elements_new],
				last_index: messages.length,
			};
		});
		setLastMessageIndex(messages.length);
	}, [messages.length]);

	return (
		<NotificationContext
			value={{
				notifications: notificationsState.elements,
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
		</NotificationContext>
	);
}

export function useNotification() {
	const context = useContext(NotificationContext);
	if (!context)
		throw new Error('useNotification must be used within NotificationProvider');
	return context;
}
