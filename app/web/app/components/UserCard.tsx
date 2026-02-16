import { Link } from 'react-router';
import Icon from './Icon';
import InfoText from './InfoText';
import Button from './Button';

type FriendStatus = 'none' | 'pending' | 'friends';

interface UserCardProps {
	username: string;
	avatar?: string;
	teamName?: string;
	challengesSolved: number;
	totalPoints: number;
	friendStatus?: FriendStatus;
	onAddFriend?: () => void;
	onCancelRequest?: () => void;
}

export default function UserCard({
	username,
	avatar,
	teamName,
	challengesSolved,
	totalPoints,
	friendStatus = 'none',
	onAddFriend,
	onCancelRequest,
}: UserCardProps) {
	const getButtonContent = () => {
		switch (friendStatus) {
			case 'friends':
				return (
					<span className="flex items-center gap-2">
						<Icon name="check" className="size-4" aria-hidden={true} />
						Friends
					</span>
				);
			case 'pending':
				return 'Pending';
			default:
				return 'Add Friend';
		}
	};

	const getButtonProps = () => {
		if (friendStatus === 'friends') {
			return {
				'variant': 'ghost' as const,
				'disabled': true,
				'aria-label': `Already friends with ${username}`,
			};
		}
		if (friendStatus === 'pending') {
			return {
				'variant': 'secondary' as const,
				'onClick': onCancelRequest,
				'aria-label': `Cancel friend request to ${username}`,
			};
		}
		return {
			'variant': 'primary' as const,
			'onClick': onAddFriend,
			'aria-label': `Send friend request to ${username}`,
		};
	};

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
							<span className="font-semibold text-primary">{totalPoints}</span>{' '}
							Points
						</InfoText>
					</div>
				</div>

				{(onAddFriend || onCancelRequest) && (
					<Button size="sm" {...getButtonProps()}>
						{getButtonContent()}
					</Button>
				)}
			</div>
		</article>
	);
}
