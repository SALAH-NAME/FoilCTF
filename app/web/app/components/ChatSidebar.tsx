import { useRef, useEffect, useState } from 'react';
import Icon from './Icon';
import Button from './Button';
import ChatMessage from './ChatMessage';
import PageSection from './PageSection';

interface ChatMessageData {
	id: number;
	username: string;
	message: string;
	timestamp: string;
	isSystem?: boolean;
	isAnnouncement?: boolean;
	team?: string;
	calssName?: string;
}

interface ChatSidebarProps {
	messages: ChatMessageData[];
	isConnected: boolean;
	onSendMessage: (message: string) => void;
	className?: string;
}

export default function ChatSidebar({
	messages,
	isConnected,
	onSendMessage,
	className = '',
}: ChatSidebarProps) {
	const [messageInput, setMessageInput] = useState('');
	const chatContainerRef = useRef<HTMLDivElement>(null);
	const messageInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop =
				chatContainerRef.current.scrollHeight;
		}
	}, [messages]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!messageInput.trim() || !isConnected) return;

		onSendMessage(messageInput);
		setMessageInput('');
		messageInputRef.current?.focus();
	};

	return (
		<PageSection className={`h-full flex flex-col bg-neutral-50 ${className}`}>
			<div
				className="flex flex-col h-full"
				role="region"
				aria-labelledby="chat-heading"
			>
				<div className="flex items-center justify-between mb-4 shrink-0">
					<h2
						id="chat-heading"
						className="text-xl font-bold text-dark flex items-center gap-2"
					>
						<Icon name="chat" className="w-5 h-5" aria-hidden={true} />
						Live Chat
					</h2>
					<div
						className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
						role="status"
						aria-label={isConnected ? 'Connected' : 'Disconnected'}
					/>
				</div>

				<div
					ref={chatContainerRef}
					className="flex-1 overflow-y-auto bg-neutral-50 border border-neutral-200 rounded-md p-2 mb-4 space-y-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:rounded-full"
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

				<form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
					<label htmlFor="chat-input" className="sr-only">
						Type your message
					</label>
					<input
						ref={messageInputRef}
						id="chat-input"
						type="text"
						value={messageInput}
						onChange={(e) => setMessageInput(e.target.value)}
						placeholder="Type a message..."
						disabled={!isConnected}
						className="flex-1 px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-neutral-100 disabled:cursor-not-allowed text-sm"
						aria-label="Chat message input"
					/>
					<Button
						type="submit"
						disabled={!isConnected || !messageInput.trim()}
						size="sm"
						aria-label="Send message"
					>
						Send
					</Button>
				</form>
			</div>
		</PageSection>
	);
}
