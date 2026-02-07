import type { Route } from './+types/profile';

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
		<div className="h-full bg-background p-4 md:p-8">
			<div className="max-w-4xl mx-auto space-y-6">
				<div className="bg-white rounded-md p-6 md:p-8 border border-dark/10">
					<div className="flex flex-col md:flex-row items-start md:items-center gap-6">
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
						<button className="w-full md:w-auto bg-primary text-white font-semibold px-6 py-2.5 rounded-md hover:bg-primary/90 transition-colors">
							Edit Profile
						</button>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="bg-white rounded-md p-6 border border-dark/10 text-center">
						<p className="text-4xl font-bold text-primary mb-2">
							{user.stats.solved}
						</p>
						<p className="text-dark/60 font-medium">Challenges Solved</p>
					</div>
					<div className="bg-white rounded-md p-6 border border-dark/10 text-center">
						<p className="text-4xl font-bold text-primary mb-2">
							{user.stats.events}
						</p>
						<p className="text-dark/60 font-medium">Events Participated In</p>
					</div>
					<div className="bg-white rounded-md p-6 border border-dark/10 text-center">
						<p className="text-4xl font-bold text-primary mb-2">
							{user.stats.points}
						</p>
						<p className="text-dark/60 font-medium">Total Points</p>
					</div>
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
							<button className="text-primary bg-transparent border-primary border-2 font-semibold hover:underline">
								Change Password
							</button>
						</div>
						<div className="pt-2">
							<button className="text-red-600 bg-transparent border-red-600 border-2 font-semibold hover:underline">
								Delete Account
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
