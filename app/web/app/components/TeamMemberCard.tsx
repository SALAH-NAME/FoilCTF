import { Link } from 'react-router';
import { useState } from 'react';
import Icon from './Icon';
import InfoText from './InfoText';
import Button from './Button';
import Modal from './Modal';

interface TeamMemberCardProps {
	username: string;
	avatar: string | null;
	challenges_solved?: number | null;
	total_points?: number | null;
	is_captain?: boolean;
	is_editable?: boolean;
	onMakeCaptain?: () => void;
	onKick?: () => void;
}

export default function TeamMemberCard({
	username,
	avatar,
	challenges_solved = 0,
	total_points = 0,
	is_captain = false,
	is_editable = false,
	onMakeCaptain,
	onKick,
}: TeamMemberCardProps) {
	const [showMakeCaptainModal, setShowMakeCaptainModal] = useState(false);
	const [showKickModal, setShowKickModal] = useState(false);

	const handleConfirmMakeCaptain = () => {
		onMakeCaptain?.();
		setShowMakeCaptainModal(false);
	};

	const handleConfirmKick = () => {
		onKick?.();
		setShowKickModal(false);
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
							className="size-16 rounded-full bg-linear-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl relative"
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
							{is_captain && (
								<div
									className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1"
									title="Team Captain"
								>
									<Icon name="star" className="size-4 stroke-3 text-white" />
								</div>
							)}
						</div>
					</Link>

					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-1">
							<Link
								to={`/users/${username}`}
								className="text-lg font-bold text-dark hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:rounded no-underline"
							>
								<h3>{username}</h3>
							</Link>
							{is_captain && (
								<span
									className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full"
									aria-label="Team captain"
								>
									Captain
								</span>
							)}
						</div>
						<div className="flex flex-wrap gap-3 text-sm text-dark/80">
							<InfoText icon="challenge" iconClassName="size-4">
								<span className="font-semibold">{challenges_solved}</span> Solved
							</InfoText>
							<InfoText icon="trophy" iconClassName="size-4">
								<span className="font-semibold text-primary">
									{total_points}
								</span>{' '}
								Points
							</InfoText>
						</div>
					</div>

					{!is_captain && is_editable && (
						<div className="flex gap-2">
							<Button
								size="sm"
								variant="secondary"
								onClick={() => setShowMakeCaptainModal(true)}
								aria-label={`Make ${username} team captain`}
							>
								Make Captain
							</Button>
							<Button
								size="sm"
								variant="danger"
								onClick={() => setShowKickModal(true)}
								aria-label={`Kick ${username} from team`}
							>
								Kick
							</Button>
						</div>
					)}
				</div>
			</article>

			<Modal
				isOpen={showMakeCaptainModal}
				onClose={() => setShowMakeCaptainModal(false)}
				title="Transfer Captain Role"
				size="sm"
				footer={
					<div className="flex gap-3 justify-end">
						<Button
							variant="ghost"
							onClick={() => setShowMakeCaptainModal(false)}
						>
							Cancel
						</Button>
						<Button variant="primary" onClick={handleConfirmMakeCaptain}>
							Confirm
						</Button>
					</div>
				}
			>
				<p className="text-dark/80">
					Are you sure you want to make{' '}
					<span className="font-semibold">{username}</span> the team captain?
					You will lose your captain privileges.
				</p>
			</Modal>

			<Modal
				isOpen={showKickModal}
				onClose={() => setShowKickModal(false)}
				title="Kick Member"
				size="sm"
				footer={
					<div className="flex gap-3 justify-end">
						<Button variant="ghost" onClick={() => setShowKickModal(false)}>
							Cancel
						</Button>
						<Button variant="danger" onClick={handleConfirmKick}>
							Kick
						</Button>
					</div>
				}
			>
				<p className="text-dark/80">
					Are you sure you want to kick{' '}
					<span className="font-semibold">{username}</span> from the team?
				</p>
			</Modal>
		</>
	);
}
