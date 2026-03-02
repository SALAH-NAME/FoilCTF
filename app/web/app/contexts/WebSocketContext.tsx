import {
	useQuery,
	useQueryClient,
	type UseQueryResult,
} from '@tanstack/react-query';
import {
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
} from 'react';

import { useToast } from '~/contexts/ToastContext';
import type { SessionUser } from '~/session.server';
import type { NotificationType } from '~/contexts/NotificationContext';

type NotificationMessageNew = {
	event: 'new';
	target_id: number;
	metadata: {
		created_at: string;
		id: number;
		is_read: boolean;
		link: string;
		message: string;
		title: string;
		type: NotificationType;
	};
};
type NotificationMessage = NotificationMessageNew;
export const NotificationSocketContext = createContext<{
	is_open: boolean;
	messages: NotificationMessage[];
	performOpen: (token: string) => void;

	query?: UseQueryResult<NotificationMessageNew[], Error>;

	remoteMarkRead: (id: number) => Promise<void>;
	remoteMarkAllRead: () => Promise<void>;
	remoteDismiss: (id: number) => Promise<void>;
	remoteClearAll: () => Promise<void>;
}>({
	messages: [],
	is_open: false,
	performOpen: () => {},
	remoteMarkRead: async () => {},
	remoteMarkAllRead: async () => {},
	remoteDismiss: async () => {},
	remoteClearAll: async () => {},
});

async function remote_fetch_notifications(token: string) {
	const url = new URL(
		'/api/notifications',
		import.meta.env.BROWSER_REST_NOTIFICATION_ORIGIN
	);
	const headers = new Headers({ Authorization: `Bearer ${token}` });
	const res = await fetch(url, { headers });
	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
	type JSONData_Notification = {
		notification_id: number;
		is_read: boolean;
		created_at: string;
		contents: {
			type?: NotificationType;
			title: string;
			message: string;
		};
	};
	type JSONData_Notifications = {
		notifications: JSONData_Notification[];
		total_count: number;
		unread_count: number;
	};
	return json as JSONData_Notifications;
}

async function remote_mark_read_notification(token: string, id: number) {
	const url = new URL(
		`/api/notifications/${id}`,
		import.meta.env.BROWSER_REST_NOTIFICATION_ORIGIN
	);
	const headers = new Headers({ Authorization: `Bearer ${token}` });
	const res = await fetch(url, { method: 'PATCH', headers });
	if (!res.ok) {
		const json = await res.json().catch(() => ({}));
		throw new Error(json.error ?? 'Failed to mark notification as read');
	}
}

async function remote_mark_all_read_notifications(token: string) {
	const url = new URL(
		'/api/notifications',
		import.meta.env.BROWSER_REST_NOTIFICATION_ORIGIN
	);
	const headers = new Headers({ Authorization: `Bearer ${token}` });
	const res = await fetch(url, { method: 'PATCH', headers });
	if (!res.ok) {
		const json = await res.json().catch(() => ({}));
		throw new Error(json.error ?? 'Failed to mark all notifications as read');
	}
}

async function remote_dismiss_notification(token: string, id: number) {
	const url = new URL(
		`/api/notifications/${id}`,
		import.meta.env.BROWSER_REST_NOTIFICATION_ORIGIN
	);
	const headers = new Headers({ Authorization: `Bearer ${token}` });
	const res = await fetch(url, { method: 'DELETE', headers });
	if (!res.ok) {
		const json = await res.json().catch(() => ({}));
		throw new Error(json.error ?? 'Failed to dismiss notification');
	}
}

async function remote_clear_all_notifications(token: string) {
	const url = new URL(
		'/api/notifications',
		import.meta.env.BROWSER_REST_NOTIFICATION_ORIGIN
	);
	const headers = new Headers({ Authorization: `Bearer ${token}` });
	const res = await fetch(url, { method: 'DELETE', headers });
	if (!res.ok) {
		const json = await res.json().catch(() => ({}));
		throw new Error(json.error ?? 'Failed to clear all notifications');
	}
}

type NotificationSocketProviderProps = {
	url: string;
	user?: SessionUser;
	children: any;
};
export function NotificationSocketProvider({
	url,
	user,
	children,
}: NotificationSocketProviderProps) {
	const { addToast } = useToast();
	const queryClient = useQueryClient();

	const ref_socket = useRef<WebSocket>(null);
	const [is_open, setIsOpen] = useState<boolean>(false);
	const [notificationMessages, setNotificationMessages] = useState<
		NotificationMessage[]
	>([]);

	const queryKey = [
		'notifications',
		{ token: user?.token_access, username: user?.username },
	];
	const query = useQuery({
		queryKey,
		async queryFn() {
			if (!user?.token_access || !user?.username) return [];

			const { notifications } = await remote_fetch_notifications(
				user.token_access
			);
			const notificationMessages: NotificationMessage[] = notifications.map(
				(n) => ({
					event: 'new',
					target_id: user?.id,
					metadata: {
						created_at: n.created_at,
						id: n.notification_id,
						is_read: n.is_read,
						link: '',
						message: n.contents.message,
						title: n.contents.title,
						type: n.contents.type ?? 'system',
					},
				})
			);
			setNotificationMessages(notificationMessages);
			return notificationMessages;
		},
	});

	const performOpen = useCallback(
		(token: string) => {
			if (ref_socket.current) return;

			ref_socket.current = new WebSocket(url + '?token=' + token);
			ref_socket.current.onopen = () => {
				setIsOpen(true);
			};
			ref_socket.current.onclose = () => {
				ref_socket.current = null;
				setIsOpen(false);
				addToast({
					variant: 'warning',
					title: 'Notifications',
					message: 'Channel is closed',
				});
			};
			ref_socket.current.onerror = (event) => {
				console.error('WebSocket error:', event);
			};
			ref_socket.current.onmessage = (msg: MessageEvent<string>) => {
				const data = JSON.parse(msg.data);
				switch (data.event) {
					case 'new':
						setNotificationMessages((old) => [...old, data]);
						break;
					case 'read':
						setNotificationMessages((old) =>
							old.map((m) =>
								m.metadata.id === data.metadata?.notification_id
									? { ...m, metadata: { ...m.metadata, is_read: true } }
									: m
							)
						);
						break;
					case 'read_all':
						setNotificationMessages((old) =>
							old.map((m) => ({
								...m,
								metadata: { ...m.metadata, is_read: true },
							}))
						);
						break;
					case 'delete':
						setNotificationMessages((old) =>
							old.filter(
								(m) => m.metadata.id !== data.metadata?.notification_id
							)
						);
						break;
					case 'delete_all':
						setNotificationMessages([]);
						break;
				}
			};
		},
		[url]
	);

	const remoteMarkRead = useCallback(
		async (id: number) => {
			if (!user?.token_access) return;
			await remote_mark_read_notification(user.token_access, id);
			queryClient.invalidateQueries({ queryKey });
		},
		[user?.token_access, queryClient, queryKey]
	);

	const remoteMarkAllRead = useCallback(async () => {
		if (!user?.token_access) return;
		await remote_mark_all_read_notifications(user.token_access);
		queryClient.invalidateQueries({ queryKey });
	}, [user?.token_access, queryClient, queryKey]);

	const remoteDismiss = useCallback(
		async (id: number) => {
			if (!user?.token_access) return;
			await remote_dismiss_notification(user.token_access, id);
			queryClient.invalidateQueries({ queryKey });
		},
		[user?.token_access, queryClient, queryKey]
	);

	const remoteClearAll = useCallback(async () => {
		if (!user?.token_access) return;
		await remote_clear_all_notifications(user.token_access);
		queryClient.invalidateQueries({ queryKey });
	}, [user?.token_access, queryClient, queryKey]);

	return (
		<NotificationSocketContext
			value={{
				messages: notificationMessages,
				query,
				is_open,
				performOpen,
				remoteMarkRead,
				remoteMarkAllRead,
				remoteDismiss,
				remoteClearAll,
			}}
		>
			{children}
		</NotificationSocketContext>
	);
}

export function useNotificationSocketProvider() {
	const context = useContext(NotificationSocketContext);
	if (!context)
		throw new Error(
			'useNotificationSocketProvider must be called inside of a NotificationSocketProvider'
		);
	return context;
}
