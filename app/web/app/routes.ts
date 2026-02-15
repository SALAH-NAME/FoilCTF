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
		route('dashboard', 'routes/dashboard.tsx'),
		route('instances', 'routes/instances.tsx'),
		route('challenges', 'routes/challenges.tsx'),
		route('register', 'routes/register.tsx'),
		route('signin', 'routes/signin.tsx'),
		route('profile', 'routes/profile.tsx'),
		route('privacy-policy', 'routes/privacy-policy.tsx'),
		route('terms-of-service', 'routes/terms-of-service.tsx'),
	]),
	route('*', 'routes/not_found.tsx'),
] satisfies RouteConfig;

export default routes;
