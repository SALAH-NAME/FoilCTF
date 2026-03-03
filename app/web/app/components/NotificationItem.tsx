import { Link } from 'react-router';
import Icon, { type IconName } from './Icon';
import type {
	Notification,
	NotificationType,
} from '../contexts/NotificationContext';

interface TypeConfig {
	icon: IconName;
	bg: string;
	iconColor: string;
	label: string;
}

const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
	event: {
		icon: 'calendar',
		bg: 'bg-primary/10',
		iconColor: 'text-primary',
		label: 'Event',
	},
	challenge: {
		icon: 'challenge',
		bg: 'bg-warning/10',
		iconColor: 'text-warning',
		label: 'Challenge',
	},
	team: {
		icon: 'team',
		bg: 'bg-success/10',
		iconColor: 'text-success',
		label: 'Team',
	},
	friend: {
		icon: 'users',
		bg: 'bg-info/10',
		iconColor: 'text-info',
		label: 'Friend',
	},
	achievement: {
		icon: 'trophy',
		bg: 'bg-warning/10',
		iconColor: 'text-warning',
		label: 'Achievement',
	},
	system: {
		icon: 'info',
		bg: 'bg-secondary/20',
		iconColor: 'text-muted',
		label: 'System',
	},
};

function formatTimeAgo(timestamp: string): string {
	const diff = Date.now() - new Date(timestamp).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return 'just now';
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	const days = Math.floor(hrs / 24);
	if (days < 7) return `${days}d ago`;
	const weeks = Math.floor(days / 7);
	return `${weeks}w ago`;
}

interface NotificationItemProps {
	notification: Notification;
	onMarkAsRead: (id: string) => void;
	onDismiss: (id: string) => void;
	onClose: () => void;
}

export default function NotificationItem({
	notification,
	onMarkAsRead,
	onDismiss,
	onClose,
}: NotificationItemProps) {
	const { id, type, title, message, timestamp, read, link } = notification;
	const cfg = TYPE_CONFIG[type];
	const timeAgo = formatTimeAgo(timestamp);
	const isoTime = new Date(timestamp).toISOString();

	function handleActivate() {
		onMarkAsRead(id);
		onClose();
	}

	const content = (
		<>
			{!read && (
				<span
					className="absolute top-3.5 right-3 w-2 h-2 rounded-full bg-primary shrink-0"
					aria-hidden="true"
				/>
			)}

			<div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
				<div
					className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5 ${cfg.bg}`}
					aria-hidden="true"
				>
					<Icon name={cfg.icon} className={`size-4 ${cfg.iconColor}`} />
				</div>

				<div className="flex-1 min-w-0">
					<p
						className={`text-sm leading-snug truncate ${read ? 'text-dark/70 font-normal' : 'text-dark font-semibold'}`}
					>
						{title}
					</p>
					<p className="text-xs text-muted mt-0.5 line-clamp-2 leading-relaxed">
						{message}
					</p>
					<time dateTime={isoTime} className="text-xs text-muted/70 mt-1 block">
						{timeAgo}
					</time>
				</div>
			</div>
		</>
	);

	const baseClass = `group relative flex items-start w-full text-left px-4 py-3.5 transition-colors
		${read ? 'bg-background hover:bg-dark/5' : 'bg-primary/5 hover:bg-primary/10'}
		focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary`;

	return (
		<li role="listitem">
			<div className="relative flex items-stretch">
				{link ? (
					<Link
						to={link}
						onClick={handleActivate}
						className={`${baseClass} flex-1 no-underline`}
						aria-label={`${cfg.label}: ${title}. ${message} ${timeAgo}.${read ? '' : ' Unread.'}`}
					>
						{content}
					</Link>
				) : (
					<button
						type="button"
						onClick={() => onMarkAsRead(id)}
						className={`${baseClass} flex-1`}
						aria-label={`${cfg.label}: ${title}. ${message} ${timeAgo}.${read ? '' : ' Unread.'}`}
					>
						{content}
					</button>
				)}

				<button
					type="button"
					onClick={() => onDismiss(id)}
					aria-label={`Dismiss notification: ${title}`}
					className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md text-muted hover:text-dark hover:bg-dark/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
					tabIndex={0}
				>
					<Icon name="close" className="size-3.5" />
				</button>
			</div>
		</li>
	);
}
