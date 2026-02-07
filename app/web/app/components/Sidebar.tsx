import { Link, useLocation } from 'react-router';
import { useSidebar } from '../contexts/SidebarContext';
import Icon from './Icon';
import { NavGroup, type NavItemConfig } from './NavLink';

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
	const { isExpanded, toggleExpanded } = useSidebar();
	const location = useLocation();

	return (
		<>
			<aside
				className={`
                    sticky top-0 left-0 h-screen z-50
                    border-r border-dark/10 bg-background
                    transition-all duration-300 ease-in-out
                    ${isExpanded ? 'w-64 max-w-64' : 'w-20'}
                `}
			>
				<div className="flex flex-col h-full">
					<div className="flex-1">
						<Link
							to="/"
							className={`flex items-center  p-4 border-b border-dark/10
								 transition-all duration-300 w-full no-underline delay-300
								  ${isExpanded ? 'gap-3 ' : ''}`}
							title="FoilCTF"
						>
							<div className="w-8 h-8 ml-2 bg-primary rounded-md flex items-center justify-center text-white font-bold text-2xl shrink-0">
								F
							</div>
							<h1
								className={`text-xl font-bold whitespace-nowrap text-dark transition-opacity duration-300 ${
									isExpanded
										? 'opacity-100 delay-300'
										: 'opacity-0 w-0 overflow-hidden'
								}`}
							>
								FoilCTF
							</h1>
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
							} ${isExpanded ? 'gap-3' : ''}`}
							title={isExpanded ? undefined : 'Profile'}
						>
							<div className="w-8 h-8 my-1 bg-secondary rounded-full flex items-center justify-center shrink-0">
								<Icon name="user" className="size-4 text-white" />
							</div>
							{isExpanded && (
								<div
									className={`flex-1 min-w-0 transition-opacity duration-300 ${
										isExpanded
											? 'opacity-100 delay-300'
											: 'opacity-0 w-0 overflow-hidden'
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

						{/* <button
							type="button"
							className={`w-full flex items-center px-3 py-2 rounded-md hover:bg-accent/20 text-dark transition-colors gap-3`}
							title={isExpanded ? undefined : 'Sign Out'}
						>
							<Icon name="logout" className="size-5 shrink-0" />
							<span
								className={`whitespace-nowrap transition-opacity duration-300 ${
									isExpanded
										? 'opacity-100 delay-300'
										: 'opacity-0 w-0 overflow-hidden'
								}`}
							>
								Sign Out
							</span>
						</button> */}

						<button
							type="button"
							onClick={toggleExpanded}
							className={`flex w-full items-center ${isExpanded ? 'px-3' : ''} py-2 rounded-md hover:bg-accent/20 text-dark transition-colors gap-3`}
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
					</div>
				</div>
			</aside>
		</>
	);
}
