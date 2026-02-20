import {
	type RouteConfig,
	index,
	layout,
	route,
} from '@react-router/dev/routes';

const routes = [
	layout('./layouts/dashboard.tsx', [
		index('routes/index.tsx'),
		route('events', 'routes/events.tsx'),
		route('events/:id', 'routes/events.$id.tsx'),
		route('events/:id/leaderboard', 'routes/events.$id.leaderboard.tsx'),
		route('events/:id/play', 'routes/events.$id.play.tsx'),
		route('instances', 'routes/instances.tsx'),
		route('challenges', 'routes/challenges.tsx'),
		route('teams', 'routes/teams.tsx'),
		route('teams/:id', 'routes/teams.$id.tsx'),
		route('team', 'routes/team.tsx'),
		route('users', 'routes/users.tsx'),
		route('users/:username', 'routes/users.$username.tsx'),
		route('/oauth/42', 'routes/oauth42.tsx'),

		route('privacy-policy', 'routes/privacy-policy.tsx'),
		route('terms-of-service', 'routes/terms-of-service.tsx'),

		layout('./layouts/guest.tsx', [
			route('register', 'routes/register.tsx'),
			route('signin', 'routes/signin.tsx'),
		]),

		layout('./layouts/auth.tsx', [
			route('signout', 'routes/signout.tsx'),
			route('friends', 'routes/friends.tsx'),
			route('profile', 'routes/profile.tsx'),

			layout('./layouts/admin.tsx', [
				route('dashboard', 'routes/dashboard.tsx'),
			]),
		]),
	]),
	route('*', 'routes/not_found.tsx'),
] satisfies RouteConfig;

export default routes;
