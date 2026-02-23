import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react';

import { useToast } from '~/contexts/ToastContext';

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
		type: 'system';
	};
};
type NotificationMessage = NotificationMessageNew;
export const NotificationSocketContext = createContext<{
	performOpen: (token: string) => void;
	messages: NotificationMessage[];
	is_open: boolean;
}>({ messages: [], is_open: false, performOpen: () => {} });

type NotificationSocketProviderProps = {
	url: string;
	children: any;
};
export function NotificationSocketProvider({
	url,
	children,
}: NotificationSocketProviderProps) {
	const { addToast } = useToast();

	const ref_socket = useRef<WebSocket>(null);
	const [is_open, setIsOpen] = useState<boolean>(false);
	const [notificationMessages, setNotificationMessages] = useState<
		NotificationMessage[]
	>([]);

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
			value={{ messages: notificationMessages, is_open, performOpen }}
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
