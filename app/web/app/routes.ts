import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

const routes = [
	layout('./layouts/dashboard.tsx', [
		index('routes/index.tsx'),
		route('challenges/:challId', 'routes/challenge_edit.tsx'),
	]),
	route('*', 'routes/not_found.tsx'),
] satisfies RouteConfig;

export default routes;
