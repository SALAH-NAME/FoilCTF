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
	isParentCollapsed?: boolean;
}

export function NavLink({
	item,
	isNested = false,
	isParentCollapsed = false,
}: NavLinkProps) {
	const location = useLocation();
	const { isExpanded, isMobileOpen } = useSidebar();
	const [isOpen, setIsOpen] = useState(true);

	const hasChildren = item.children && item.children.length > 0;

	const isActive = item.to
		? item.to.includes('?')
			? location.pathname + location.search === item.to
			: location.pathname === item.to
		: false;

	const showLabels = isExpanded || isMobileOpen;
	const isHidden = isParentCollapsed;

	if (hasChildren) {
		return (
			<div>
				<div
					className={`flex items-center gap-1 w-full rounded-md
					${isActive ? 'bg-primary hover:bg-accent/20 hover:text-dark text-white font-bold' : 'hover:bg-primary text-dark hover:text-white'}
					`}
				>
					<Link
						to={item.to || '#'}
						aria-current={isActive ? 'page' : undefined}
						className={`
					flex-1 flex items-center px-3.5 py-2 rounded-md
					transition-colors gap-3  w-full no-underline
					${isActive ? 'focus-visible:ring-dark' : 'focus-visible:ring-primary'}
					focus:outline-none focus-visible:ring-2 focus:ring-inset
					${isNested ? 'pl-2' : ''}
				`}
						title={showLabels ? undefined : item.label}
					>
						<Icon
							name={item.icon}
							className="size-5 shrink-0"
							aria-hidden={true}
						/>
						<span
							className={`text-left whitespace-nowrap transition-opacity duration-300 opacity-100
								${showLabels ? 'delay-300' : 'md:opacity-0 md:w-0 md:overflow-hidden'}`}
						>
							{item.label}
						</span>
					</Link>
					<button
						type="button"
						onClick={() => setIsOpen(!isOpen)}
						tabIndex={showLabels ? 0 : -1}
						className={`
								p-1 px-2 mx-2 rounded-md bg-transparent hover:bg-background text-dark
								transition-opacity duration-300
							${isActive ? 'focus-visible:ring-dark' : 'focus-visible:ring-primary'}
							focus:outline-none focus-visible:ring-2
								${showLabels ? 'opacity-100 delay-300' : 'md:opacity-0 md:overflow-hidden md:pointer-events-none opacity-100'}
								`}
						aria-label={isOpen ? 'Collapse submenu' : 'Expand submenu'}
						aria-expanded={isOpen}
					>
						<Icon
							name="chevronDown"
							className={`size-4 transition-transform 
									${isOpen ? 'rotate-0' : '-rotate-90'}
									`}
							aria-hidden={true}
						/>
					</button>
				</div>

				<div
					className={`transition-all duration-300 ease-in-out
						 ${showLabels && isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden '}
						 `}
				>
					<div className="ml-4 mt-1 space-y-1 transition-all duration-300">
						{item.children?.map((child) => (
							<NavLink
								key={child.to || child.label}
								item={child}
								isNested
								isParentCollapsed={!showLabels || !isOpen}
							/>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<Link
			to={item.to || '#'}
			aria-current={isActive ? 'page' : undefined}
			tabIndex={isHidden ? -1 : 0}
			className={`
				flex items-center px-3.5 py-2 rounded-md
				transition-colors gap-3 w-full no-underline
				${isActive ? 'focus-visible:ring-dark' : 'focus-visible:ring-primary'}
				focus:outline-none focus-visible:ring-2 focus-visible:ring-inset
				${isActive ? 'bg-primary hover:bg-accent/20 hover:text-dark text-white font-bold' : 'hover:bg-primary hover:text-white text-dark'}
				${isNested ? 'text-dark/80 text-sm' : ''}
			`}
			title={showLabels ? undefined : item.label}
		>
			<Icon
				name={item.icon}
				className={`shrink-0 ${isNested ? 'size-4' : 'size-5'}`}
				aria-hidden={true}
			/>
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
