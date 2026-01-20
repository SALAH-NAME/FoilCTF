import { type RouteConfig, index, route } from '@react-router/dev/routes';

const routes = [
	index('routes/home.tsx'),
	route('welcome', 'routes/welcome.tsx'),
	route('*', 'routes/not_found.tsx'),
] satisfies RouteConfig;

export default routes;
