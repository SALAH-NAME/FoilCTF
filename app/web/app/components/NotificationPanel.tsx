import { useEffect, useRef, useCallback, useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useSidebar } from '../contexts/SidebarContext';
import Icon from './Icon';
import NotificationItem from './NotificationItem';

export default function NotificationPanel() {
	const {
		notifications,
		unreadCount,
		isPanelOpen,
		closePanel,
		markAsRead,
		markAllAsRead,
		dismiss,
		clearAll,
	} = useNotification();

	const { isExpanded } = useSidebar();

	const panelRef = useRef<HTMLDivElement>(null);
	const closeBtnRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!isPanelOpen) return;
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') closePanel();
		};
		document.addEventListener('keydown', handleKey);
		return () => document.removeEventListener('keydown', handleKey);
	}, [isPanelOpen, closePanel]);

	useEffect(() => {
		if (isPanelOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [isPanelOpen]);

	useEffect(() => {
		if (isPanelOpen) {
			const timer = setTimeout(() => closeBtnRef.current?.focus(), 50);
			return () => clearTimeout(timer);
		}
	}, [isPanelOpen]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key !== 'Tab') return;
		const panel = panelRef.current;
		if (!panel) return;

		const focusable = panel.querySelectorAll<HTMLElement>(
			'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		if (e.shiftKey) {
			if (document.activeElement === first) {
				e.preventDefault();
				last?.focus();
			}
		} else {
			if (document.activeElement === last) {
				e.preventDefault();
				first?.focus();
			}
		}
	}, []);

	const [isDesktop, setIsDesktop] = useState(false);
	useEffect(() => {
		const mq = window.matchMedia('(min-width: 768px)');
		const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
		setIsDesktop(mq.matches);

		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	}, []);

	const sidebarWidth = isExpanded ? '16rem' : '5rem';
	const panelLeft = isDesktop ? sidebarWidth : 0;

	const transformClass = isPanelOpen
		? 'translate-y-0 md:translate-x-0'
		: 'translate-y-full md:-translate-x-full md:translate-y-0';

	return (
		<>
			<div
				className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ease-in-out ${
					isPanelOpen
						? 'opacity-100 pointer-events-auto'
						: 'opacity-0 pointer-events-none'
				}`}
				onClick={closePanel}
				aria-hidden="true"
			/>

			<div
				ref={panelRef}
				role="dialog"
				aria-modal="true"
				aria-label={`Notifications${
					unreadCount > 0 ? `, ${unreadCount} unread` : ''
				}`}
				onKeyDown={handleKeyDown}
				style={
					{
						left: panelLeft,
						transitionProperty: 'transform, left, opacity',
						transitionDuration: '300ms',
						transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
					} as React.CSSProperties
				}
				className={`
					fixed z-45 flex flex-col bg-background
					bottom-0 left-0 right-0 rounded-t-2xl
					border-t border-x border-dark/10
					md:top-0 md:bottom-auto md:right-auto
					md:w-80 md:h-screen md:rounded-none
					md:border-t-0 md:border-l-0 md:border-x-0 md:border-r md:border-dark/10
					${transformClass}
				`}
			>
				<div
					className="md:hidden flex justify-center pt-3 pb-1 shrink-0"
					aria-hidden="true"
				>
					<div className="w-10 h-1 rounded-full bg-dark/20" />
				</div>

				<div className="flex items-center justify-between px-4 py-3.5 border-b border-dark/10 shrink-0">
					<div className="flex items-center gap-1">
						<Icon name="bell" className="size-5 text-dark" aria-hidden />
						<h2 className="text-sm font-semibold text-dark">Notifications</h2>
						{unreadCount > 0 && (
							<span
								className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full bg-primary text-white"
								aria-live="polite"
								aria-label={`${unreadCount} unread`}
							>
								{unreadCount > 99 ? '99+' : unreadCount}
							</span>
						)}
					</div>

					<div className="flex items-center gap-4">
						{unreadCount > 0 && (
							<button
								type="button"
								onClick={markAllAsRead}
								className="text-xs bg-primary/10 text-dark hover:text-primary-dark font-medium px-2 py-1 rounded-md hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
								aria-label="Mark all notifications as read"
							>
								Mark all read
							</button>
						)}
						<button
							ref={closeBtnRef}
							type="button"
							onClick={closePanel}
							className="p-1.5 rounded-md text-white hover:text-dark hover:bg-dark/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
							aria-label="Close notifications panel"
						>
							<Icon name="close" className="size-4 stroke-2" />
						</button>
					</div>
				</div>

				<div className="sr-only" aria-live="polite" aria-atomic="false">
					{unreadCount > 0
						? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
						: 'No unread notifications'}
				</div>

				<div
					className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:rounded-full"
					role="region"
					aria-label="Notification list"
				>
					{notifications.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full min-h-48 gap-3 py-16 px-6 text-center">
							<div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
								<Icon name="bell" className="size-6 text-muted" aria-hidden />
							</div>
							<p className="text-sm font-medium text-dark">
								You're all caught up!
							</p>
							<p className="text-xs text-muted">
								No notifications at the moment.
							</p>
						</div>
					) : (
						<ul role="list" aria-label="Notifications">
							{notifications.map((notification) => (
								<NotificationItem
									key={notification.id}
									notification={notification}
									onMarkAsRead={markAsRead}
									onDismiss={dismiss}
									onClose={closePanel}
								/>
							))}
						</ul>
					)}
				</div>

				{notifications.length > 0 && (
					<div className="shrink-0 border-t border-dark/10 px-4 py-3">
						<button
							type="button"
							onClick={clearAll}
							className="w-full text-white hover:text-dark font-medium py-1.5 rounded-md hover:bg-dark/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
							aria-label="Clear all notifications"
						>
							Clear all notifications
						</button>
					</div>
				)}
			</div>
		</>
	);
}
