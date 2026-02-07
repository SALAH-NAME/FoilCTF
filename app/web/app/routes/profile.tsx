import type { Route } from './+types/profile';
import Button from '../components/Button';
import StatsCard from '../components/StatsCard';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Profile' }];
}

export default function Page() {
	// TODO: Replace API RealData
	const user = {
		username: 'John_Doe',
		email: 'john@example.com',
		joinedDate: 'January 2024',
		stats: {
			solved: 11,
			events: 6,
			points: 1250,
		},
	};

	return (
		<div className="h-full bg-background p-4">
			<div className="max-w-4xl mx-auto space-y-6">
				<div className="bg-white rounded-md p-6 md:p-8 border border-dark/10">
					<div className="flex flex-col md:flex-row items-center md:items-center gap-4">
						<div className="w-20 h-20 md:w-24 md:h-24 bg-secondary rounded-full flex items-center justify-center shrink-0">
							<span className="text-3xl md:text-4xl font-bold text-white">
								{user.username.charAt(0)}
							</span>
						</div>
						<div className="flex-1">
							<h1 className="text-3xl md:text-4xl font-bold text-dark mb-2">
								{user.username}
							</h1>
							<p className="text-sm text-dark/50">Joined {user.joinedDate}</p>
						</div>
						<Button className="w-full md:w-auto">Edit</Button>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<StatsCard value={user.stats.solved} label="Challenges Solved" />
					<StatsCard value={user.stats.events} label="Events Participated In" />
					<StatsCard value={user.stats.points} label="Total Points" />
				</div>

				<div className="bg-white rounded-md p-6 md:p-8 border border-dark/10">
					<h2 className="text-2xl font-bold text-dark mb-6">
						Account Settings
					</h2>
					<div className="space-y-4">
						<div className="pb-4 border-b border-dark/10">
							<h3 className="text-sm font-semibold text-dark mb-1">Username</h3>
							<p className="text-dark/60">{user.username}</p>
						</div>
						<div className="pb-4 border-b border-dark/10">
							<h3 className="text-sm font-semibold text-dark mb-1">Email</h3>
							<p className="text-dark/60">{user.email}</p>
						</div>
						<div className="pb-4 border-b border-dark/10">
							<h3 className="text-sm font-semibold text-dark mb-1">Password</h3>
							<Button variant="secondary" size="sm">
								Change Password
							</Button>
						</div>
						<div className="pt-2">
							<Button variant="danger" size="sm">
								Delete Account
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
