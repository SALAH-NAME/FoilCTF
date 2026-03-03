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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

export async function remote_fetch_event_status(token: string, id: string) {
	const uri = new URL(
		`/api/events/${id}/status`,
		import.meta.env.BROWSER_REST_EVENTS_ORIGIN
	);
	const headers = new Headers({ 'Authorization': `Bearer ${token}` });
	const res = await fetch(uri, { headers });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');

	type JSONData_EventStatus = {
		chatroom_id: number;
		team_name: string;
		rank: number;
		total_points: number;
		solved_challenges: number;
		total_challenges: number;
	};
	return json as JSONData_EventStatus;
}
export async function remote_fetch_event_challenges(token: string, id: string) {
	const uri = new URL(
		`/api/events/${id}/challenges`,
		import.meta.env.BROWSER_REST_EVENTS_ORIGIN
	);
	const headers = new Headers({ 'Authorization': `Bearer ${token}` });
	const res = await fetch(uri, { headers });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');

	type JSONData_EventChallenges = {
		[category: string]: {
			id: number;
			name: string;
			description: string;
			category: string;
			reward: number;
			solves: number;
			is_solved: boolean;
		}[],
	};
	return json as JSONData_EventChallenges;
}
export async function remote_submit_event_flag(token: string, event_id: string, challenge_id: string, flag: string) {
	const uri = new URL(
		`/api/events/${event_id}/challenges/${challenge_id}/submit`,
		import.meta.env.BROWSER_REST_EVENTS_ORIGIN
	);
	const method = 'POST';
	const headers = new Headers({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' });
	const res = await fetch(uri, { method, headers, body: JSON.stringify({ flag }) });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Unexpected response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');

	type JSONData_FlagSubmit = {
		status:			"correct";
		first_blood:	boolean;
		points_earned:	number;
	};
	return json as JSONData_FlagSubmit;
}

export default function EventPlay({ loaderData, params }: Route.ComponentProps) {
	const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
		null
	);
	const [instanceStatus, setInstanceStatus] = useState<InstanceStatus>({});
	const [timeRemaining, setTimeRemaining] = useState(0);
	const [isConnected, setIsConnected] = useState(true);
	const [isChatOpen, setIsChatOpen] = useState(false);

	const { addToast } = useToast();
	const session_user = loaderData.user;

	const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
	const query_challenges = useQuery({
		queryKey: ['event-challenges', { id: params.id }],
		initialData: { },
		async queryFn() {
			if (!session_user)
				return { };

			const token = session_user.token_access;
			const data = await remote_fetch_event_challenges(token, params.id);
			const challenges: Record<string, Challenge[]> = { };
			
			let challenge_category: keyof typeof data;
			for (challenge_category in data) {
				const challenges_sub: Challenge[] = data[challenge_category].map(x => ({
					id: x.id,
					name: x.name,
					description: x.description,
					category: x.category,
					points: x.reward,
					solved: x.is_solved,
					solves: x.solves,
					author: "Unknown",
					attachments: [],
					hasInstance: false,
					firstBloodAvailable: false,
					difficulty: 'easy',
					hints: [],
				}));
				challenges[challenge_category] = challenges_sub;
			}
			return challenges;
		}
	});
	const query_status = useQuery({
		queryKey: ['event-status', { id: params.id }],
		initialData: null,
		async queryFn() {
			if (!session_user)
				return null;

			const token = session_user.token_access;
			const status = await remote_fetch_event_status(token, params.id);
			return {
				chatroom_id: status.chatroom_id,
				teamName: status.team_name,
				rank: status.rank,
				totalPoints: status.total_points,
				solvedChallenges: status.solved_challenges,
				totalChallenges: status.total_challenges,
			};
		}
	});

	const challenges = query_challenges.data;
	const eventStatus = query_status.data;
	const eventEndTime = '2026-03-03T00:00:00Z';

	const categories = Object.keys(challenges);
	const challengesByCategory = challenges;

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

	const handleBuyHint = (_hintId: number) => {
		// TODO: Implement hint purchase
		addToast({
			variant: 'info',
			title: 'Hints',
			message: 'Hint purchase is not yet available',
		});
	};

	const queryClient = useQueryClient();

	type MutationPayload<T> = {
		event_id: string;
		token: string;
	} & T;
	const mut_flag = useMutation<void, Error, MutationPayload<{ challenge_id: string, flag: string }>>({
		async mutationFn({ token, event_id, challenge_id, flag }) {
			await remote_submit_event_flag(token, event_id, challenge_id, flag);
		},
		async onSuccess() {
			addToast({
				variant: 'success',
				title: 'Flag submitted',
				message: 'Flag has been accepted and points awarded',
			});

			setSelectedChallenge(null);
			await queryClient.invalidateQueries({ queryKey: ['event-challenges'] });
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Flag submission',
				message: err.message,
			});
		}
	});
	const handleSubmitFlag = (chall_id: number, flag: string) => {
		if (!session_user)
			return ;

		console.log(chall_id, flag);
		const token = session_user.token_access;
		const event_id = params.id;
		const challenge_id = chall_id.toString();
		mut_flag.mutate({ event_id, token, challenge_id, flag });
	};

	const currentInstanceStatus = selectedChallenge
		? instanceStatus[selectedChallenge.id] || { isRunning: false }
		: { isRunning: false };

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
		if (!query_status.data?.chatroom_id) return ;

		const chatroom_id = query_status.data.chatroom_id;
		const url = new URL('/api/chat', import.meta.env.BROWSER_SOCKET_CHAT);
		url.searchParams.set('token', session_user?.token_access);
		url.searchParams.set('room', chatroom_id.toString());

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
			setChatMessages((old) => {
				if (old.findIndex(x => x.id === messageOut.id) !== -1)
					return old;
				return [...old, messageOut]
			});
		};

		return (() => {
			if (ref_socket.current?.readyState === WebSocket.OPEN)
				ref_socket.current?.close();
			ref_socket.current = null;
		});
	}, [query_status.data?.chatroom_id]);

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
							{eventStatus &&
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
							</div> }
						</div>
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
				onSendMessage={sendMessage}
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
