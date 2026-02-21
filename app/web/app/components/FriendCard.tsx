import { Link } from 'react-router';
import InfoText from './InfoText';
import Button from './Button';
import { useState } from 'react';
import Modal from './Modal';

interface FriendCardProps {
	username: string;
	avatar?: string;
	teamName?: string;
	challengesSolved: number;
	totalPoints: number;
	type: 'friend' | 'received' | 'sent';
	onRemove?: () => void;
	onAccept?: () => void;
	onReject?: () => void;
	onCancel?: () => void;
}

export default function FriendCard({
	username,
	avatar,
	teamName,
	challengesSolved,
	totalPoints,
	type,
	onRemove,
	onAccept,
	onReject,
	onCancel,
}: FriendCardProps) {
	const [showRemoveModal, setShowRemoveModal] = useState(false);

	const handleRemoveClick = () => {
		setShowRemoveModal(true);
	};

	const handleConfirmRemove = () => {
		onRemove?.();
		setShowRemoveModal(false);
	};

	return (
		<>
			<article className="bg-white/70 rounded-md p-6 border border-dark/10 hover:border-primary transition-all duration-200 hover:shadow-lg">
				<div className="flex items-start gap-4">
					<Link
						to={`/users/${username}`}
						className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:rounded"
						aria-label={`View ${username}'s profile`}
					>
						<div
							className="size-16 rounded-full bg-linear-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl"
							aria-hidden={true}
						>
							{avatar ? (
								<img
									src={avatar}
									alt=""
									className="size-full rounded-full object-cover"
								/>
							) : (
								username.charAt(0).toUpperCase()
							)}
						</div>
					</Link>

					<div className="flex-1 min-w-0">
						<Link
							to={`/users/${username}`}
							className="text-lg font-bold text-dark hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:rounded no-underline block mb-1"
						>
							<h3>{username}</h3>
						</Link>
						{teamName && (
							<InfoText icon="user" className="text-sm text-dark/60 mb-2">
								{teamName}
							</InfoText>
						)}
						<div className="flex flex-wrap gap-3 text-sm text-dark/80">
							<InfoText icon="challenge" iconClassName="size-4">
								<span className="font-semibold">{challengesSolved}</span> Solved
							</InfoText>
							<InfoText icon="trophy" iconClassName="size-4">
								<span className="font-semibold text-primary">
									{totalPoints}
								</span>{' '}
								Points
							</InfoText>
						</div>
					</div>

					<div className="flex gap-2">
						{type === 'friend' && onRemove && (
							<Button
								size="sm"
								variant="danger"
								onClick={handleRemoveClick}
								aria-label={`Remove ${username} from friends`}
							>
								Remove
							</Button>
						)}
						{type === 'received' && (
							<>
								{onAccept && (
									<Button
										size="sm"
										variant="primary"
										onClick={onAccept}
										aria-label={`Accept friend request from ${username}`}
									>
										Accept
									</Button>
								)}
								{onReject && (
									<Button
										size="sm"
										variant="secondary"
										onClick={onReject}
										aria-label={`Reject friend request from ${username}`}
									>
										Reject
									</Button>
								)}
							</>
						)}
						{type === 'sent' && onCancel && (
							<Button
								size="sm"
								variant="secondary"
								onClick={onCancel}
								aria-label={`Cancel friend request to ${username}`}
							>
								Cancel
							</Button>
						)}
					</div>
				</div>
			</article>

			<Modal
				isOpen={showRemoveModal}
				onClose={() => setShowRemoveModal(false)}
				title="Remove Friend"
				size="sm"
				footer={
					<div className="flex gap-3 justify-end">
						<Button variant="ghost" onClick={() => setShowRemoveModal(false)}>
							Cancel
						</Button>
						<Button variant="danger" onClick={handleConfirmRemove}>
							Remove
						</Button>
					</div>
				}
			>
				<p className="text-dark/80">
					Are you sure you want to remove{' '}
					<span className="font-semibold">{username}</span> from your friends
					list?
				</p>
			</Modal>
		</>
	);
}
