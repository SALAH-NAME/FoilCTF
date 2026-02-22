import { useEffect } from 'react';
import { data, Outlet } from 'react-router';

import { useToast } from '~/contexts/ToastContext';
import { useSidebar } from '~/contexts/SidebarContext';
import { commitSession, request_session } from '~/session.server';

import Icon from '~/components/Icon';
import Logo from '~/components/Logo';
import Footer from '~/components/Footer';
import Sidebar from '~/components/Sidebar';
import SkipLink from '~/components/SkipLink';
import NotificationBell from '../components/NotificationBell';

import type { Route } from './+types/dashboard';

export async function loader({ request }: Route.LoaderArgs) {
	const session = await request_session(request);
	const flashError = session.get('error');
	return data(
		{ flashError },
		{ headers: { 'Set-Cookie': await commitSession(session) } }
	);
}
export default function Layout({ loaderData }: Route.ComponentProps) {
	const { addToast } = useToast();
	const { toggleMobile } = useSidebar();
	useEffect(() => {
		if (!loaderData.flashError) return;

		addToast({
			variant: 'error',
			title: 'Session Error',
			message: loaderData.flashError,
		});
	}, [loaderData]);

	return (
		<>
			<SkipLink />
			<div className="flex min-h-screen">
				<header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-dark/10 flex items-center justify-between px-4 z-50">
					<button
						type="button"
						onClick={toggleMobile}
						className="p-2 hover:bg-accent/20 rounded-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark"
						aria-label="Toggle menu"
					>
						<Icon
							name="menu"
							className="size-6 text-white"
							aria-hidden={true}
						/>
					</button>

					<div className="absolute left-1/2 -translate-x-1/2">
						<Logo size="md" showText />
					</div>

					<NotificationBell variant="navbar" />
				</header>

				<Sidebar />
				<div className="flex-1 flex flex-col">
					<main
						id="main-content"
						className="flex-1 p-4 transition-all duration-300 md:pt-4 pt-20"
					>
						<Outlet />
					</main>
					<Footer />
				</div>
			</div>
		</>
	);
}
