import { Link, useLocation } from 'react-router';
import { useState } from 'react';
import Icon from './Icon';
import { useSidebar } from '../contexts/SidebarContext';

export interface NavItemConfig {
	to?: string;
	label: string;
	icon:
		| 'home'
		| 'calendar'
		| 'chart'
		| 'user'
		| 'logout'
		| 'challenge'
		| 'instance';
	children?: NavItemConfig[];
}

interface NavLinkProps {
	item: NavItemConfig;
	isNested?: boolean;
}

export function NavLink({ item, isNested = false }: NavLinkProps) {
	const location = useLocation();
	const { isExpanded, isMobileOpen } = useSidebar();
	const [isOpen, setIsOpen] = useState(true);

	const hasChildren = item.children && item.children.length > 0;
	const isActive = item.to ? location.pathname === item.to : false;
	const showLabels = isExpanded || isMobileOpen;

	if (hasChildren) {
		return (
			<div>
				<div
					className={`flex items-center gap-1 w-full rounded-md
					${isActive ? 'bg-primary hover:bg-accent/20 hover:text-dark text-white' : 'hover:bg-primary text-dark'}
					`}
				>
					<Link
						to={item.to || '#'}
						className={`
							flex-1 flex items-center px-3 py-2 rounded-md
							transition-colors gap-3  w-full no-underline
							${isNested ? 'pl-2' : ''}
						`}
						title={showLabels ? undefined : item.label}
					>
						<Icon name={item.icon} className="size-5 shrink-0" />
						<span
							className={`text-left whitespace-nowrap transition-opacity duration-300 
								${showLabels ? 'opacity-100 delay-300' : 'md:opacity-0 md:w-0 md:overflow-hidden opacity-100'}`}
						>
							{item.label}
						</span>
					</Link>
					<button
						type="button"
						onClick={() => setIsOpen(!isOpen)}
						className={`
								p-1 px-2 mx-2 rounded-md bg-transparent hover:bg-background text-dark
								transition-opacity duration-300
								${showLabels ? 'opacity-100 delay-300' : 'md:opacity-0 md:overflow-hidden md:pointer-events-none opacity-100'}
								`}
						aria-label={isOpen ? 'Collapse' : 'Expand'}
					>
						<Icon
							name="chevronDown"
							className={`size-4 transition-transform 
									${isOpen ? 'rotate-0' : '-rotate-90'}
									`}
						/>
					</button>
				</div>

				<div
					className={`overflow-hidden transition-all duration-300 ease-in-out ${
						showLabels && isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
					}`}
				>
					<div className="ml-4 mt-1 space-y-1">
						{item.children?.map((child) => (
							<NavLink key={child.to || child.label} item={child} isNested />
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<Link
			to={item.to || '#'}
			className={`
				flex items-center px-3 py-2 rounded-md
				transition-colors  w-full no-underline
				${isActive ? 'bg-primary hover:bg-accent/20 hover:text-dark text-white' : 'hover:bg-primary text-dark'}
				${showLabels ? 'gap-3' : 'md:gap-0 gap-3'}
				${isNested ? 'text-dark/80' : ''}
			`}
			title={showLabels ? undefined : item.label}
		>
			<Icon name={item.icon} className="size-5 shrink-0" />
			<span
				className={`whitespace-nowrap transition-opacity duration-300 ${
					showLabels
						? 'opacity-100 delay-300'
						: 'md:opacity-0 md:w-0 md:overflow-hidden opacity-100'
				}`}
			>
				{item.label}
			</span>
		</Link>
	);
}

interface NavGroupProps {
	items: NavItemConfig[];
}

export function NavGroup({ items }: NavGroupProps) {
	return (
		<nav className="space-y-2">
			{items.map((item) => (
				<NavLink key={item.to || item.label} item={item} />
			))}
		</nav>
	);
}
