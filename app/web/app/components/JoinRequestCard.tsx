import { Link } from 'react-router';
import InfoText from './InfoText';
import Button from './Button';

interface JoinRequestCardProps {
	username: string;
	avatar?: string;
	challengesSolved?: number;
	totalPoints?: number;
	requestedAt?: string;
	onAccept: () => void;
	onReject: () => void;
}

export default function JoinRequestCard({
	username,
	avatar,
	challengesSolved,
	totalPoints,
	requestedAt,
	onAccept,
	onReject,
}: JoinRequestCardProps) {
	return (
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
					<InfoText icon="calendar" className="text-sm text-dark/60 mb-2">
						Requested{' '}
						{new Date(requestedAt ?? Date.now()).toLocaleDateString('en-US', {
							month: 'short',
							day: 'numeric',
							year: 'numeric',
						})}
					</InfoText>
					<div className="flex flex-wrap gap-3 text-sm text-dark/80">
						<InfoText icon="challenge" iconClassName="size-4">
							<span className="font-semibold">{challengesSolved}</span> Solved
						</InfoText>
						<InfoText icon="trophy" iconClassName="size-4">
							<span className="font-semibold text-primary">{totalPoints}</span>{' '}
							Points
						</InfoText>
					</div>
				</div>

				<div className="flex gap-2">
					<Button
						size="sm"
						variant="primary"
						onClick={onAccept}
						aria-label={`Accept ${username}'s join request`}
					>
						Accept
					</Button>
					<Button
						size="sm"
						variant="secondary"
						onClick={onReject}
						aria-label={`Reject ${username}'s join request`}
					>
						Reject
					</Button>
				</div>
			</div>
		</article>
	);
}
