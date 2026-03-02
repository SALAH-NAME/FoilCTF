import { useQuery, type UseQueryResult } from '@tanstack/react-query';
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

	query?: UseQueryResult<NotificationMessageNew[], Error>,
}>({ messages: [], is_open: false, performOpen: () => {} });

async function remote_fetch_notifications(token: string) {
	const url = new URL('/api/notifications', import.meta.env.BROWSER_REST_NOTIFICATION_ORIGIN);
	const headers = new Headers({ 'Authorization': `Bearer ${token}` });
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
		},
	};
	type JSONData_Notifications = {
		notifications: JSONData_Notification[];
		total_count: number;
		unread_count: number;
	};
	return json as JSONData_Notifications;
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

	const ref_socket = useRef<WebSocket>(null);
	const [is_open, setIsOpen] = useState<boolean>(false);
	const [notificationMessages, setNotificationMessages] = useState<
		NotificationMessage[]
	>([]);

	const query = useQuery({
		queryKey: ['notifications', { token: user?.token_access, username: user?.username }],
		async queryFn() {
			if (!user?.token_access || !user?.username)
				return [];

			const { notifications } = await remote_fetch_notifications(user.token_access);
			const notificationMessages: NotificationMessage[] = notifications.map(n => ({
				event: 'new',
				target_id: user?.id,
				metadata: {
					created_at: n.created_at,
					id: n.notification_id,
					is_read: n.is_read,
					link: "",
					message: n.contents.message,
					title: n.contents.title,
					type: n.contents.type ?? 'system',
				},
			}));
			setNotificationMessages(notificationMessages);
			return notificationMessages;
		}
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
			};
			ref_socket.current.onerror = (event) => {
				console.error('WebSocket error:', event);
			};
			ref_socket.current.onmessage = (msg: MessageEvent<string>) => {
				const notificationMessage = JSON.parse(msg.data);
				setNotificationMessages((oldNotificationMessages) => {
					return [...oldNotificationMessages, notificationMessage];
				});
			};
		},
		[url]
	);

	return (
		<NotificationSocketContext
			value={{ messages: notificationMessages, query, is_open, performOpen }}
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
