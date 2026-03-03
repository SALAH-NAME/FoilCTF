import { useNotification } from '../contexts/NotificationContext';
import { useSidebar } from '../contexts/SidebarContext';
import Icon from './Icon';

interface NotificationBellProps {
	variant: 'sidebar' | 'navbar';
}

export default function NotificationBell({ variant }: NotificationBellProps) {
	const { unreadCount, isPanelOpen, togglePanel } = useNotification();
	const { isExpanded, isMobileOpen, closeMobile } = useSidebar();

	const showLabel = isExpanded || isMobileOpen;

	const ariaLabel = isPanelOpen
		? 'Close notifications panel'
		: `Open notifications panel${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`;

	const BellIcon = (
		<div className="relative flex items-center justify-center shrink-0">
			<Icon
				name={unreadCount > 0 ? 'bellAlert' : 'bell'}
				className="size-5"
				aria-hidden
			/>
			{unreadCount > 0 && (
				<span
					className="group-hover:bg-white group-hover:text-dark absolute -top-4 -right-3 min-w-4 h-4 px-0.5 flex items-center justify-center text-[10px] font-bold rounded-full bg-primary text-white leading-none"
					aria-hidden="true"
				>
					{unreadCount > 9 ? '9+' : unreadCount}
				</span>
			)}
		</div>
	);

	if (variant === 'navbar') {
		return (
			<button
				type="button"
				onClick={togglePanel}
				aria-label={ariaLabel}
				aria-expanded={isPanelOpen}
				aria-haspopup="dialog"
				className={`group relative p-2 rounded-md transition-colors duration-200
					focus:outline-none focus-visible:ring-2 focus-visible:ring-primary   bg-dark/10
					${
						isPanelOpen
							? 'bg-primary/10 text-primary'
							: 'text-dark hover:bg-accent/20 hover:text-dark'
					}`}
			>
				{BellIcon}
			</button>
		);
	}

	return (
		<button
			type="button"
			onClick={() => {
				if (isMobileOpen) closeMobile();
				togglePanel();
			}}
			aria-label={ariaLabel}
			aria-expanded={isPanelOpen}
			aria-haspopup="dialog"
			title={showLabel ? undefined : 'Notifications'}
			className={`
				w-full flex items-center px-2 py-2 rounded-md  bg-dark/10
				transition-colors duration-200 group gap-3
				focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary
				${
					isPanelOpen
						? 'bg-primary/10 text-primary'
						: 'hover:bg-primary text-dark hover:text-white'
				}
				${showLabel ? '' : ''}
			`}
		>
			<div className="w-8 h-8 my-1 flex items-center justify-center shrink-0">
				{BellIcon}
			</div>

			<span
				className={`
					flex-1 text-left text-sm whitespace-nowrap
					transition-[opacity,width] 
					${
						showLabel
							? 'opacity-100 delay-300'
							: 'md:opacity-0 md:w-0 md:overflow-hidden opacity-100'
					}
				`}
			>
				Notifications
			</span>
		</button>
	);
}
