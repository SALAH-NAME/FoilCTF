import Icon from './Icon';

interface FloatingChatButtonProps {
	onClick: () => void;
	unreadCount?: number;
	isConnected: boolean;
}

export default function FloatingChatButton({
	onClick,
	unreadCount = 0,
	isConnected,
}: FloatingChatButtonProps) {
	return (
		<button
			onClick={onClick}
			className="fixed bottom-6 right-4 z-50 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:hidden"
			aria-label={`Open live chat${unreadCount > 0 ? `, ${unreadCount} unread messages` : ''}`}
			aria-haspopup="dialog"
		>
			<div className="relative">
				<Icon name="chat" className="w-6 h-6" aria-hidden={true} />
				{unreadCount > 0 && (
					<span
						className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
						aria-label={`${unreadCount} unread`}
					>
						{unreadCount > 9 ? '9+' : unreadCount}
					</span>
				)}
			</div>
		</button>
	);
}
