import { Link, useLocation } from 'react-router';
import { useSidebar } from '../contexts/SidebarContext';
import Icon from './Icon';
import Logo from './Logo';
import { NavGroup, type NavItemConfig } from './NavLink';
import { useEffect } from 'react';

const navItems: NavItemConfig[] = [
	{ to: '/', label: 'Home', icon: 'home' },
	{ to: '/events', label: 'Events', icon: 'calendar' },
	{
		to: '/dashboard',
		label: 'Dashboard',
		icon: 'chart',
		children: [
			{ to: '/challenges', label: 'Challenges', icon: 'challenge' },
			{ to: '/instances', label: 'Instances', icon: 'instance' },
		],
	},
	{ to: '/signin', label: 'Sign In', icon: 'user' },
];

export default function Sidebar() {
	const { isExpanded, toggleExpanded, isMobileOpen, closeMobile } =
		useSidebar();
	const location = useLocation();

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

	return (
		<>
			{isMobileOpen && (
				<div
					className="md:hidden fixed inset-0 bg-black/50 z-40"
					onClick={closeMobile}
					aria-hidden="true"
				/>
			)}

			<aside
				className={`
                    md:sticky fixed top-0 left-0 h-screen z-50
                    border-r border-dark/10 bg-background
                    transition-all duration-300 ease-in-out
                    ${isExpanded ? 'md:w-64 md:max-w-64' : 'md:w-20'}
                    ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
                `}
			>
				<div className="flex flex-col h-full">
					<div className="flex-1">
						<Link
							to="/"
							className="flex items-center p-4 border-b border-dark/10 transition-all duration-300 w-full no-underline"
							title="FoilCTF"
						>
							<Logo
								size="md"
								showText={isExpanded || isMobileOpen}
								className="ml-2"
							/>
						</Link>

						<div className="p-4">
							<NavGroup items={navItems} />
						</div>
					</div>

					<div className="border-t border-dark/10 p-4 space-y-2">
						<Link
							to="/profile"
							className={`w-full flex items-center px-2 py-2 rounded-md transition-colors no-underline ${
								location.pathname === '/profile'
									? 'bg-primary hover:bg-accent/20  text-white'
									: 'hover:bg-primary text-dark'
							} ${isExpanded ? 'gap-3' : 'md:gap-0 gap-3'}`}
							title={isExpanded ? undefined : 'Profile'}
						>
							<div className="w-8 h-8 my-1 bg-secondary rounded-full flex items-center justify-center shrink-0">
								<Icon name="user" className="size-4 text-white" />
							</div>
							{(isExpanded || isMobileOpen) && (
								<div
									className={`flex-1 min-w-0 transition-opacity duration-300 ${
										isExpanded
											? 'opacity-100 delay-300'
											: 'md:opacity-0 md:w-0 md:overflow-hidden opacity-100'
									}`}
								>
									<p className="text-sm font-medium truncate text-dark">
										John Doe
									</p>
									<p className="text-xs text-dark/60 truncate">
										john@example.com
									</p>
								</div>
							)}
						</Link>

						<button
							type="button"
							onClick={toggleExpanded}
							className={`hidden md:flex w-full items-center ${isExpanded ? 'px-3' : ''} py-2 rounded-md hover:bg-accent/20 text-white transition-colors gap-3`}
							aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
						>
							<Icon
								name={isExpanded ? 'chevronLeft' : 'chevronRight'}
								className={`size-5 shrink-0 transition-all duration-300 ${
									isExpanded ? '' : 'delay-300'
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
							className="md:hidden flex w-full items-center px-3 py-2 rounded-md hover:bg-accent/20 text-white transition-colors gap-3"
							aria-label="Close menu"
						>
							<Icon name="close" className="size-5 shrink-0" />
							<span className="whitespace-nowrap">Close Menu</span>
						</button>
					</div>
				</div>
			</aside>
		</>
	);
}
