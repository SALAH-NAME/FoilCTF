import { useRef, useEffect, useState } from 'react';
import Icon from './Icon';
import Button from './Button';
import ChatMessage from './ChatMessage';

interface ChatMessageData {
	id: number;
	username: string;
	message: string;
	timestamp: string;
	isSystem?: boolean;
	isAnnouncement?: boolean;
	team?: string;
}

interface FullScreenChatProps {
	isOpen: boolean;
	onClose: () => void;
	messages: ChatMessageData[];
	isConnected: boolean;
	onSendMessage: (message: string) => void;
}

export default function FullScreenChat({
	isOpen,
	onClose,
	messages,
	isConnected,
	onSendMessage,
}: FullScreenChatProps) {
	const [messageInput, setMessageInput] = useState('');
	const chatContainerRef = useRef<HTMLDivElement>(null);
	const messageInputRef = useRef<HTMLInputElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const sendButtonRef = useRef<HTMLButtonElement>(null);
	const dialogRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop =
				chatContainerRef.current.scrollHeight;
		}
	}, [messages]);

	useEffect(() => {
		if (isOpen) {
			closeButtonRef.current?.focus();

			document.body.style.overflow = 'hidden';

			const handleEscape = (e: KeyboardEvent) => {
				if (e.key === 'Escape') {
					onClose();
				}
			};

			const handleTabKeyPress = (e: KeyboardEvent) => {
				if (e.key !== 'Tab' || !dialogRef.current) return;

				const focusableElements =
					dialogRef.current.querySelectorAll<HTMLElement>(
						'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
					);

				const firstElement = focusableElements[0];
				const lastElement = focusableElements[focusableElements.length - 1];

				if (!firstElement || !lastElement) return;

				if (e.shiftKey) {
					if (document.activeElement === firstElement) {
						e.preventDefault();
						lastElement.focus();
					}
				} else {
					if (document.activeElement === lastElement) {
						e.preventDefault();
						firstElement.focus();
					}
				}
			};

			window.addEventListener('keydown', handleEscape);
			window.addEventListener('keydown', handleTabKeyPress);

			return () => {
				document.body.style.overflow = '';
				window.removeEventListener('keydown', handleEscape);
				window.removeEventListener('keydown', handleTabKeyPress);
			};
		}
	}, [isOpen, onClose]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!messageInput.trim() || !isConnected) return;

		onSendMessage(messageInput);
		setMessageInput('');
		messageInputRef.current?.focus();
	};

	if (!isOpen) return null;

	return (
		<div
			ref={dialogRef}
			className="fixed inset-0 z-50 bg-white lg:hidden flex flex-col"
			role="dialog"
			aria-modal="true"
			aria-labelledby="fullscreen-chat-heading"
		>
			<div className="flex items-center justify-between p-4 border-b border-neutral-200 shrink-0 bg-linear-to-r from-primary to-secondary">
				<h2
					id="fullscreen-chat-heading"
					className="text-xl font-bold text-white flex items-center gap-2"
				>
					<Icon name="chat" className="w-5 h-5" aria-hidden={true} />
					Live Chat
				</h2>
				<div className="flex items-center gap-3">
					<button
						ref={closeButtonRef}
						onClick={onClose}
						className="text-white hover:bg-white/20 p-2 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
						aria-label="Close chat"
					>
						<Icon name="close" className="w-6 h-6" aria-hidden={true} />
					</button>
				</div>
			</div>

			<div
				ref={chatContainerRef}
				className="flex-1 overflow-y-auto bg-neutral-50 p-4 space-y-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:rounded-full"
				role="log"
				aria-live="polite"
				aria-atomic="false"
			>
				{messages.length === 0 ? (
					<p className="text-muted text-sm text-center p-4">
						No messages yet. Be the first to chat!
					</p>
				) : (
					messages.map((msg) => (
						<ChatMessage
							key={msg.id}
							username={msg.username}
							message={msg.message}
							timestamp={new Date(msg.timestamp)}
							isSystem={msg.isSystem}
							isAnnouncement={msg.isAnnouncement}
							team={msg.team}
						/>
					))
				)}
			</div>

			<form
				onSubmit={handleSubmit}
				className="flex gap-2 p-4 border-t border-neutral-200 shrink-0 bg-white"
			>
				<label htmlFor="fullscreen-chat-input" className="sr-only">
					Type your message
				</label>
				<input
					ref={messageInputRef}
					id="fullscreen-chat-input"
					type="text"
					value={messageInput}
					onChange={(e) => setMessageInput(e.target.value)}
					placeholder="Type a message..."
					disabled={!isConnected}
					className="flex-1 px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-neutral-100 disabled:cursor-not-allowed text-sm"
					aria-label="Chat message input"
				/>
				<Button
					ref={sendButtonRef}
					type="submit"
					disabled={!isConnected || !messageInput.trim()}
					size="sm"
					aria-label="Send message"
				>
					Send
				</Button>
			</form>
		</div>
	);
}
