import { data, Outlet } from "react-router";
import { SidebarProvider } from "~/contexts/SidebarContext";
import { NotificationProvider } from "~/contexts/NotificationContext";
import { NotificationSocketProvider } from "~/contexts/WebSocketContext";

import type { Route } from "./+types/notifications";

import { request_session_user } from "~/session.server";

export async function loader({ request }: Route.LoaderArgs) {
	const user = await request_session_user(request);
	return data({ user });
}

export default function Layout({loaderData}: Route.ComponentProps) {
	const ws_notifications = URL.parse(
		'/api/notifications/ws',
		import.meta.env.BROWSER_SOCKET_NOTIFICATION
	);
	if (!ws_notifications)
		throw new Error('Could not construct WebSocket url for notifications');
	return (
		<NotificationSocketProvider user={loaderData.user} url={ws_notifications.toString()}>
			<NotificationProvider>
				<SidebarProvider>
					<Outlet />
				</SidebarProvider>
			</NotificationProvider>
		</NotificationSocketProvider>
	);
}
