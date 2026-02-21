import Icon from './Icon';

interface ChatMessageProps {
	username: string;
	message: string;
	timestamp: Date;
	isSystem?: boolean;
	isAnnouncement?: boolean;
	team?: string;
}

export default function ChatMessage({
	username,
	message,
	timestamp,
	isSystem = false,
	isAnnouncement = false,
	team,
}: ChatMessageProps) {
	const formattedTime = new Date(timestamp).toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
	});

	if (isSystem || isAnnouncement) {
		return (
			<div
				className={`px-3 py-2 rounded-md ${
					isAnnouncement
						? 'bg-amber-50 border-l-4 border-amber-500'
						: 'bg-neutral-100 border-l-4 border-neutral-400'
				}`}
				role="log"
				aria-live="polite"
			>
				<div className="flex items-start gap-2">
					<Icon
						name={isAnnouncement ? 'megaphone' : 'info'}
						className={`w-4 h-4 mt-0.5 shrink-0 ${
							isAnnouncement ? 'text-amber-600' : 'text-neutral-600'
						}`}
						aria-hidden={true}
					/>
					<div className="flex-1 min-w-0">
						<div className="flex items-baseline gap-2 mb-1">
							<span
								className={`font-semibold text-sm ${
									isAnnouncement ? 'text-amber-900' : 'text-neutral-700'
								}`}
							>
								{isAnnouncement ? 'Announcement' : 'System'}
							</span>
							<time
								className="text-xs text-muted"
								dateTime={timestamp.toISOString()}
							>
								{formattedTime}
							</time>
						</div>
						<p
							className={`text-sm ${
								isAnnouncement ? 'text-amber-800' : 'text-neutral-600'
							}`}
						>
							{message}
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="px-3 py-2" role="log" aria-live="polite">
			<div className="flex items-start gap-2">
				<div className="flex-1 min-w-0">
					<div className="flex items-baseline gap-2 mb-1 flex-wrap">
						<span className="font-semibold text-sm text-dark">{username}</span>
						{team && (
							<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
								<Icon name="users" className="w-3 h-3" aria-hidden={true} />
								{team}
							</span>
						)}
						<time
							className="text-xs text-muted"
							dateTime={timestamp.toISOString()}
						>
							{formattedTime}
						</time>
					</div>
					<p className="text-sm text-dark warp-break-words">{message}</p>
				</div>
			</div>
		</div>
	);
}
