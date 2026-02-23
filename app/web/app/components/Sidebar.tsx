import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';

import { useSidebar } from '~/contexts/SidebarContext';
import type { SessionUser } from '~/session.server';

import Icon from '~/components/Icon';
import Logo from '~/components/Logo';
import NotificationBell from '~/components/NotificationBell';
import NotificationPanel from '~/components/NotificationPanel';
import { NavGroup, NavLink, type NavItemConfig } from '~/components/NavLink';
import { fetch_user } from '~/routes/profile';

const navItems: NavItemConfig[] = [
	{ to: '/', label: 'Home', icon: 'home' },
	{
		to: '/events',
		label: 'Events',
		icon: 'calendar',
		children: [
			{ to: '/events?filter=active', label: 'Active', icon: 'calendar' },
			{ to: '/events?filter=upcoming', label: 'Upcoming', icon: 'calendar' },
			{ to: '/events?filter=ended', label: 'Past', icon: 'calendar' },
		],
	},
	{
		to: '/dashboard',
		label: 'Dashboard',
		icon: 'chart',
		children: [
			{ to: '/challenges', label: 'Challenges', icon: 'challenge' },
			{ to: '/instances', label: 'Instances', icon: 'instance' },
		],
	},
	{
		to: '/teams',
		label: 'Teams',
		icon: 'team',
		children: [
			{ to: '/teams', label: 'Browse Teams', icon: 'team' },
			{ to: '/team', label: 'My Team', icon: 'team' },
		],
	},
	{
		to: '/friends',
		label: 'Social',
		icon: 'users',
		children: [
			{ to: '/friends', label: 'Friends', icon: 'users' },
			{ to: '/users', label: 'Find Users', icon: 'users' },
		],
	},
	{ to: '/signin', label: 'Sign In', icon: 'user' },
];

type SidebarProps = {
	session_user: SessionUser | undefined;
};
export default function Sidebar({ session_user }: SidebarProps) {
	const { isExpanded, toggleExpanded, isMobileOpen, closeMobile } =
		useSidebar();

	const location = useLocation();
	const is_profile_active = location.pathname == '/profile';

	useEffect(() => {
		closeMobile();
	}, [location.pathname, closeMobile]);
	useEffect(() => {
		if (isMobileOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isMobileOpen]);
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isMobileOpen) {
				closeMobile();
			}
		};

		document.addEventListener('keydown', handleEscape);
		return () => {
			document.removeEventListener('keydown', handleEscape);
		};
	}, [isMobileOpen, closeMobile]);

	const query_user = useQuery({
		queryKey: [
			'user',
			{ username: session_user?.username },
			{ token_access: session_user?.token_access },
		],
		initialData: null,
		queryFn: async () => {
			if (!session_user) return null;
			return await fetch_user(session_user.token_access);
		},
	});
	const user = query_user.data;
	return (
		<>
			{isMobileOpen && (
				<div
					className="md:hidden fixed inset-0 bg-black/50 z-40"
					onClick={closeMobile}
					aria-hidden="true"
				/>
			)}

			<NotificationPanel />

			<aside
				className={`
                    md:sticky fixed top-0 left-0 h-screen z-50
                    border-r border-dark/10 bg-background
                    transition-all duration-300 ease-in-out
                    ${isExpanded ? 'md:w-64 md:max-w-64' : 'md:w-20'}
                    ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
                `}
			>
				<div
					className={`flex flex-col h-full ${!isMobileOpen ? 'hidden md:flex' : ''}`}
				>
					<div className="flex-1">
						<Link
							to="/"
							aria-label="FoilCTF Home"
							className="flex items-center p-4 border-b border-dark/10 transition-all duration-300 w-full no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
							title="FoilCTF"
						>
							<Logo
								size="md"
								showText={isExpanded || isMobileOpen}
								className="ml-2"
							/>
						</Link>

						<nav className="p-4 space-y-2" aria-label="Main navigation">
							<NavLink item={{ to: '/', label: 'Home', icon: 'home' }} />
							{!user && (
								<NavLink
									item={{ to: '/signin', label: 'Sign In', icon: 'user' }}
								/>
							)}
							<NavLink
								item={{ to: '/events', label: 'Events', icon: 'calendar' }}
							>
								<NavLink
									item={{
										to: '/events?filter=upcoming',
										label: 'Active',
										icon: 'calendar',
									}}
									isNested
								/>
								<NavLink
									item={{
										to: '/events?filter=active',
										label: 'Upcoming',
										icon: 'calendar',
									}}
									isNested
								/>
								<NavLink
									item={{
										to: '/events?filter=ended',
										label: 'Past',
										icon: 'calendar',
									}}
									isNested
								/>
							</NavLink>
							<NavLink
								item={{ to: '/dashboard', label: 'Dashboard', icon: 'chart' }}
							>
								<NavLink
									item={{
										to: '/challenges',
										label: 'Challenges',
										icon: 'challenge',
									}}
									isNested
								/>
								<NavLink
									item={{
										to: '/instances',
										label: 'Instances',
										icon: 'instance',
									}}
									isNested
								/>
							</NavLink>
							<NavLink item={{ to: '/teams', label: 'Teams', icon: 'team' }}>
								{user?.team_name && (
									<NavLink
										item={{
											to: '/team',
											label: user.team_name ?? 'My Team',
											icon: 'team',
										}}
										isNested
									/>
								)}
							</NavLink>
							<NavLink item={{ to: '/users', label: 'Users', icon: 'users' }}>
								{user && (
									<NavLink
										item={{ to: '/friends', label: 'Friends', icon: 'users' }}
										isNested
									/>
								)}
							</NavLink>
						</nav>
					</div>

					<div className="border-t border-dark/10 p-4 space-y-2">
						{user && (
							<>
								<div className="hidden md:block">
									<NotificationBell variant="sidebar" />
								</div>

								<Link
									to="/profile"
									aria-label="User profile"
									className={`w-full flex items-center px-2 py-2 rounded-md transition-colors no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-inset ${
										is_profile_active
											? 'bg-primary hover:bg-accent/20 text-white focus-visible:ring-dark'
											: 'hover:bg-primary text-dark focus-visible:ring-primary'
									} ${isExpanded ? 'gap-3' : 'md:gap-0 gap-3'}`}
									title={isExpanded ? undefined : 'Profile'}
								>
									<div
										className={`w-8 h-8 my-1  rounded-full flex items-center justify-center shrink-0 ${is_profile_active ? 'bg-white' : 'bg-secondary'}`}
									>
										<Icon
											name="user"
											className={`size-4  ${is_profile_active ? 'text-black' : 'text-white'}`}
											aria-hidden={true}
										/>
									</div>
									{(isExpanded || isMobileOpen) && (
										<div
											className={`flex-1 min-w-0 transition-opacity duration-300
										 ${
												isExpanded
													? 'opacity-100 delay-300'
													: 'md:opacity-0 md:w-0 md:overflow-hidden opacity-100'
											}
											${is_profile_active ? 'text-white hover:text-dark' : ' text-dark'}`}
										>
											<p className="text-sm font-medium truncate">John Doe</p>
											<p className="text-xs  truncate">john@example.com</p>
										</div>
									)}
								</Link>
							</>
						)}

						<button
							type="button"
							onClick={toggleExpanded}
							className={`hidden md:flex w-full items-center ${isExpanded ? 'px-3' : ''} py-2 rounded-md hover:bg-accent/20 hover:text-dark text-white transition-colors gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark focus-visible:ring-inset`}
							aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
							aria-expanded={isExpanded}
						>
							<Icon
								name={isExpanded ? 'chevronLeft' : 'chevronRight'}
								className={`size-5 shrink-0 transition-all duration-300 ${
									isExpanded ? '' : ''
								}`}
							/>
							<span
								className={`whitespace-nowrap transition-opacity duration-300 ${
									isExpanded
										? 'opacity-100 delay-300'
										: 'opacity-0 w-0 overflow-hidden'
								}`}
							>
								Collapse
							</span>
						</button>

						<button
							type="button"
							onClick={closeMobile}
							tabIndex={isMobileOpen ? 0 : -1}
							className="md:hidden flex w-full items-center px-3 py-2 rounded-md hover:bg-accent/20 text-white transition-colors gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark focus-visible:ring-inset"
							aria-label="Close menu"
						>
							<Icon
								name="close"
								className="size-5 shrink-0"
								aria-hidden={true}
							/>
							<span className="whitespace-nowrap">Close Menu</span>
						</button>
					</div>
				</div>
			</aside>
		</>
	);
}
