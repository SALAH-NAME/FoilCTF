import { data } from 'react-router';
import { useState, useEffect, useRef, useCallback } from 'react';

import mockData from '~/data/eventPlayMockData.json';
import type { Route } from './+types/events.$id.play';
import { request_session_user } from '~/session.server';

import BackLink from '~/components/BackLink';
import Countdown from '~/components/Countdown';
import ChatSidebar from '~/components/ChatSidebar';
import PageSection from '~/components/PageSection';
import ChallengeCard from '~/components/ChallengeCard';
import PlayStatusCard from '~/components/PlayStatusCard';
import ChallengeModal from '~/components/ChallengeModal';
import FullScreenChat from '~/components/FullScreenChat';
import FloatingChatButton from '~/components/FloatingChatButton';
import { useToast } from '~/contexts/ToastContext';

interface RouteParams {
	params: {
		id: string;
	};
}

interface Challenge {
	id: number;
	name: string;
	description: string;
	category: string;
	points: number;
	solved: boolean;
	solves: number;
	author: string;
	attachments: Array<{
		id: number;
		name: string;
		url: string;
	}>;
	hasInstance: boolean;
	firstBloodAvailable: boolean;
	firstBloodBy?: string;
	difficulty: 'easy' | 'medium' | 'hard';
	hints: Array<{
		id: number;
		content: string;
		penalty: number;
		purchased: boolean;
	}>;
}

interface InstanceStatusData {
	isRunning: boolean;
	ip?: string;
	port?: number;
	startedAt?: Date;
	expiresAt?: Date;
	isLaunching?: boolean;
}

type InstanceStatus = Record<number, InstanceStatusData>;

interface ChatMessage {
	id: string;
	username: string;
	message: string;
	timestamp: string;
	isSystem?: boolean;
	isAnnouncement?: boolean;
	team?: string;
}

interface EventStatus {
	teamName: string;
	rank: number;
	totalPoints: number;
	solvedChallenges: number;
	totalChallenges: number;
}

export function meta({ params }: RouteParams) {
	return [
		{ title: `Play Event ${params.id} - FoilCTF` },
		{ name: 'description', content: `Play CTF event ${params.id}` },
	];
}
export async function loader({ request }: Route.LoaderArgs) {
	const user = await request_session_user(request);
	return data({ user });
}

export default function EventPlay({ loaderData, params }: Route.ComponentProps) {
	const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
		null
	);
	const [instanceStatus, setInstanceStatus] = useState<InstanceStatus>({});
	const [timeRemaining, setTimeRemaining] = useState<number>(0);
	const [isConnected, setIsConnected] = useState(true);
	const [isChatOpen, setIsChatOpen] = useState(false);

	// Load mock data JSON
	// const chatMessages = mockData.chatMessages;
	const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
	const challenges = mockData.challenges as Challenge[];
	const eventStatus = mockData.eventData.status;
	const eventEndTime = '2026-02-21T00:00:00Z';

	const categories = Array.from(
		new Set(challenges.map((c) => c.category))
	).sort();
	const challengesByCategory: Record<string, Challenge[]> = {};
	categories.forEach((category) => {
		challengesByCategory[category] = challenges
			.filter((c) => c.category === category)
			.sort((a, b) => a.points - b.points);
	});

	useEffect(() => {
		if (!selectedChallenge) return;

		const status = instanceStatus[selectedChallenge.id];
		if (status?.isRunning && status.expiresAt) {
			const interval = setInterval(() => {
				const now = new Date().getTime();
				const expiry = new Date(status.expiresAt!).getTime();
				const remaining = Math.max(0, expiry - now);
				setTimeRemaining(Math.floor(remaining / 1000));

				if (remaining <= 0) {
					setInstanceStatus((prev) => ({
						...prev,
						[selectedChallenge.id]: { isRunning: false },
					}));
					clearInterval(interval);
				}
			}, 1000);

			return () => clearInterval(interval);
		}
	}, [selectedChallenge, instanceStatus]);

	const handleSendMessage = (message: string) => {
		// TODO: Implement WebSocket message sending
		console.log('Mock sending message:', message);
		alert('Chat is in demo mode. Message: ' + message);
	};

	const handleOpenChat = () => {
		setIsChatOpen(true);
	};

	const handleCloseChat = () => {
		setIsChatOpen(false);
	};

	const handleChallengeClick = (challenge: Challenge) => {
		setSelectedChallenge(challenge);
	};

	const handleCloseModal = () => {
		setSelectedChallenge(null);
	};

	const handleLaunchInstance = () => {
		if (!selectedChallenge) return;

		// TODO: Implement instance launch
		console.log('Launching instance for challenge:', selectedChallenge.id);
		setInstanceStatus((prev) => ({
			...prev,
			[selectedChallenge.id]: { isRunning: false, isLaunching: true },
		}));

		// Simulate instance launch
		setTimeout(() => {
			const expiresAt = new Date();
			expiresAt.setMinutes(expiresAt.getMinutes() + 30);

			setInstanceStatus((prev) => ({
				...prev,
				[selectedChallenge.id]: {
					isRunning: true,
					isLaunching: false,
					ip: '10.0.1.' + Math.floor(Math.random() * 255),
					port: 8000 + Math.floor(Math.random() * 1000),
					startedAt: new Date(),
					expiresAt: expiresAt,
				},
			}));
		}, 3000);
	};

	const handleStopInstance = () => {
		if (!selectedChallenge) return;

		setInstanceStatus((prev) => ({
			...prev,
			[selectedChallenge.id]: { isRunning: false },
		}));
	};

	const handleBuyHint = (hintId: number) => {
		// TODO: Implement hint purchase
		console.log('Buying hint:', hintId);
		alert('Hint purchase functionality will be implemented');
	};

	const handleSubmitFlag = (flag: string) => {
		// TODO: Implement flag submission
		console.log('Submitting flag for challenge:', selectedChallenge?.id, flag);
		alert('Flag submission functionality will be implemented');
	};

	const currentInstanceStatus = selectedChallenge
		? instanceStatus[selectedChallenge.id] || { isRunning: false }
		: { isRunning: false };

	const { addToast } = useToast();
	const session_user = loaderData.user;

	const ref_socket = useRef<WebSocket>(null);
	const sendMessage = useCallback((message: string) => {
		try {
			if (!ref_socket.current || !isConnected || !session_user)
				throw new Error('Cannot send message while disconnected');

			const { current: socket } = ref_socket;
			socket.send(JSON.stringify({
				event: 'message',
				content: message,
				sender_id: session_user.id.toString(),
				writer_id: session_user.id,
				name: session_user.username,
				sent_time: new Date().toISOString(),
			}))
		} catch (error: any) {
			addToast({
				variant: 'error',
				title: 'Message failed',
				message: error.message ?? 'Internal Server Error',
			});
		}
	}, [ref_socket.current, isConnected, session_user?.token_refresh])

	useEffect(() => {
		if (ref_socket.current || !session_user) return;

		const url = new URL('/api/chat', import.meta.env.BROWSER_SOCKET_CHAT);
		url.searchParams.set('token', session_user?.token_access);
		url.searchParams.set('room', '1'); // TODO(xenobas): Make this dynamic

		ref_socket.current = new WebSocket(url.toString());
		ref_socket.current.onopen = () => {
			setIsConnected(true);
		};
		ref_socket.current.onclose = () => {
			setIsConnected(false);
			ref_socket.current = null;
		};
		ref_socket.current.onerror = () => {
			addToast({
				variant: 'error',
				title: 'Chatroom',
				message: 'Network failure during connection',
			});
		};
		ref_socket.current.onmessage = (ev: MessageEvent<string>) => {
			const { data } = ev;
			type ChatMessageInc = {
				"id": number;
				"chatroom_id": number;
				"sent_time": string;
				"content": string;
				"event": string;
				"name": string;
				"is_edited": boolean;
			};
			const messageInc: ChatMessageInc = JSON.parse(data);
			if (messageInc.event === 'edit')
				return ;

			const messageOut: ChatMessage = {
				id: `${messageInc.id}`,
				isSystem: messageInc.event !== 'message',
				message: messageInc.content,
				timestamp: messageInc.sent_time,
				username: messageInc.name,
				isAnnouncement: false,
			};
			setChatMessages((old) => [...old, messageOut]);
		};

		return (() => {
			if (ref_socket.current?.readyState === WebSocket.OPEN)
				ref_socket.current?.close();
			ref_socket.current = null;
		});
	}, []);

	return (
		<div className="flex flex-col lg:flex-row lg:gap-4 min-h-screen">
			<div className="flex flex-col pb-6 gap-4 w-full lg:mr-82">
				<BackLink to={`/events/${params.id}`}>Back to Event</BackLink>
				<div className="flex flex-col gap-4 w-full mt-2">
					<PageSection>
						<div role="region" aria-labelledby="status-heading">
							<h2 id="status-heading" className="sr-only">
								Event Status
							</h2>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<PlayStatusCard
									label="Team"
									value={eventStatus.teamName}
									ariaLabel={`Team: ${eventStatus.teamName}`}
								/>
								<PlayStatusCard
									label="Rank"
									value={`#${eventStatus.rank}`}
									className="text-primary"
									ariaLabel={`Rank: ${eventStatus.rank}`}
								/>
								<PlayStatusCard
									label="Points"
									value={eventStatus.totalPoints}
									ariaLabel={`Points: ${eventStatus.totalPoints}`}
								/>
								<PlayStatusCard
									label="Solved"
									value={eventStatus.solvedChallenges}
									ariaLabel={`Solved challenges: ${eventStatus.solvedChallenges} out of ${eventStatus.totalChallenges}`}
								/>
							</div>
						</div>
					</PageSection>

					<PageSection className="lg:hidden flex items-center justify-center">
						<Countdown targetDate={eventEndTime} />
					</PageSection>

					<PageSection>
						<div role="region" aria-labelledby="challenges-heading">
							<h2
								id="challenges-heading"
								className="text-2xl font-bold text-dark mb-6"
							>
								Challenges
							</h2>
							<div className="space-y-8 w-full">
								{categories.map((category) => {
									const categoryChallenges =
										challengesByCategory[category] || [];

									return (
										<div key={category}>
											<div className="bg-linear-to-r from-primary to-secondary p-3 rounded-md mb-4">
												<h3 className="text-white font-bold text-lg">
													{category}
												</h3>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:flex  lg:flex-wrap">
												{categoryChallenges.map((challenge) => (
													<ChallengeCard
														key={challenge.id}
														name={challenge.name}
														points={challenge.points}
														solved={challenge.solved}
														solves={challenge.solves}
														difficulty={challenge.difficulty}
														firstBloodAvailable={challenge.firstBloodAvailable}
														onClick={() => handleChallengeClick(challenge)}
														className="lg:max-w-80 w-full lg:min-w-50"
													/>
												))}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</PageSection>
				</div>
			</div>

			<aside className="hidden lg:flex flex-col items-center justify-center fixed lg:top-16 right-4 w-78 h-[calc(100vh-12.1rem)] z-20">
				<Countdown targetDate={eventEndTime} />
				<ChatSidebar
					messages={chatMessages}
					isConnected={isConnected}
					onSendMessage={sendMessage}
					className="mt-2"
				/>
			</aside>

			<FloatingChatButton
				onClick={handleOpenChat}
				isConnected={isConnected}
				unreadCount={0}
			/>

			<FullScreenChat
				isOpen={isChatOpen}
				onClose={handleCloseChat}
				messages={chatMessages}
				isConnected={isConnected}
				onSendMessage={handleSendMessage}
			/>

			<ChallengeModal
				challenge={selectedChallenge}
				instanceStatus={currentInstanceStatus}
				timeRemaining={timeRemaining}
				onClose={handleCloseModal}
				onLaunchInstance={handleLaunchInstance}
				onStopInstance={handleStopInstance}
				onBuyHint={handleBuyHint}
				onSubmitFlag={handleSubmitFlag}
			/>
		</div>
	);
}
