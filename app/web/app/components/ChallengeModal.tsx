import Icon from './Icon';
import Button from './Button';
import Modal from './Modal';
import HintCard from './HintCard';
import FlagSubmitForm from './FlagSubmitForm';
import InstanceStatusPanel from './InstanceStatusPanel';

interface Attachment {
	id: number;
	name: string;
	url: string;
}

interface Hint {
	id: number;
	content: string;
	penalty: number;
	purchased: boolean;
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
	attachments: Attachment[];
	hasInstance: boolean;
	firstBloodAvailable: boolean;
	firstBloodBy?: string;
	difficulty: 'easy' | 'medium' | 'hard';
	hints: Hint[];
}

interface InstanceStatusData {
	isRunning: boolean;
	ip?: string;
	port?: number;
	startedAt?: Date;
	expiresAt?: Date;
	isLaunching?: boolean;
}

interface ChallengeModalProps {
	challenge: Challenge | null;
	instanceStatus: InstanceStatusData;
	timeRemaining: number;
	onClose: () => void;
	onLaunchInstance: () => void;
	onStopInstance: () => void;
	onBuyHint: (hintId: number) => void;
	onSubmitFlag: (flag: string) => void;
}

export default function ChallengeModal({
	challenge,
	instanceStatus,
	timeRemaining,
	onClose,
	onLaunchInstance,
	onStopInstance,
	onBuyHint,
	onSubmitFlag,
}: ChallengeModalProps) {
	if (!challenge) return null;

	return (
		<Modal
			isOpen={!!challenge}
			onClose={onClose}
			title={challenge.name}
			size="lg"
			footer={
				<div className="flex gap-3 justify-end">
					<Button variant="secondary" onClick={onClose}>
						Close
					</Button>
				</div>
			}
		>
			<div className="space-y-6">
				<div
					className="flex flex-wrap gap-4 items-center"
					role="group"
					aria-label="Challenge information"
				>
					<div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full">
						<span className="font-semibold">{challenge.points} points</span>
					</div>
					<div className="inline-flex items-center gap-2 bg-neutral-100 text-dark px-3 py-1 rounded-full">
						<span className="text-sm">{challenge.solves} solves</span>
					</div>
					<div
						className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
							challenge.difficulty === 'easy'
								? 'bg-green-100 text-green-700'
								: challenge.difficulty === 'medium'
									? 'bg-amber-100 text-amber-700'
									: 'bg-red-100 text-red-700'
						}`}
					>
						{challenge.difficulty.charAt(0).toUpperCase() +
							challenge.difficulty.slice(1)}
					</div>
					{challenge.solved && (
						<div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full">
							<span className="text-sm font-semibold">Solved</span>
						</div>
					)}
					{challenge.firstBloodAvailable && (
						<div className="inline-flex items-center gap-2 bg-amber-500 text-white px-3 py-1 rounded-full">
							<span className="text-sm font-bold">First Blood Available!</span>
						</div>
					)}
					{challenge.firstBloodBy && !challenge.firstBloodAvailable && (
						<div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
							<span className="text-sm">
								First Blood: {challenge.firstBloodBy}
							</span>
						</div>
					)}
				</div>

				<div>
					<h3 className="font-semibold text-dark mb-2">Description</h3>
					<p className="text-foreground leading-relaxed">
						{challenge.description}
					</p>
				</div>

				<div>
					<h3 className="font-semibold text-dark mb-2">Author</h3>
					<p className="text-foreground">{challenge.author}</p>
				</div>

				{challenge.attachments.length > 0 && (
					<div>
						<h3 className="font-semibold text-dark mb-2">Attachments</h3>
						<div className="flex flex-wrap space-y-2 gap-2" role="list">
							{challenge.attachments.map((attachment) => (
								<span key={attachment.id}>
									<a
										href={attachment.url}
										download
										className="flex items-center w-fit gap-2 p-1 bg-neutral-50 border border-neutral-300 rounded-md hover:bg-neutral-100 transition-colors group focus:outline-none focus:ring-2 focus:ring-primary"
										aria-label={`Download attachment: ${attachment.name}`}
									>
										<Icon
											name="link"
											className="size-5 text-primary"
											aria-hidden={true}
										/>
										<span className="flex-1 text-dark group-hover:text-primary font-medium">
											{attachment.name}
										</span>
									</a>
								</span>
							))}
						</div>
					</div>
				)}

				{challenge.hints.length > 0 && (
					<div>
						<h3 className="font-semibold text-dark mb-3">Hints</h3>
						<div className="space-y-3">
							{challenge.hints.map((hint, index) => (
								<HintCard
									key={hint.id}
									hint={hint}
									index={index}
									onBuyHint={onBuyHint}
								/>
							))}
						</div>
					</div>
				)}

				<FlagSubmitForm onSubmit={onSubmitFlag} disabled={challenge.solved} />

				{challenge.hasInstance && (
					<div className="border-t border-neutral-300 pt-6">
						<h3 className="font-semibold text-dark mb-3">Instance</h3>
						<InstanceStatusPanel
							instanceStatus={instanceStatus}
							timeRemaining={timeRemaining}
							onLaunch={onLaunchInstance}
							onStop={onStopInstance}
						/>
					</div>
				)}
			</div>
		</Modal>
	);
}
