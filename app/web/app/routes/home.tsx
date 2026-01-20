import { Link } from 'react-router';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'FoilCTF - Home' },
		// { name: 'description', content: 'Welcome to React Router!' },
	];
}

export default function Page() {
	return (<Link to="/welcome">Goto welcome</Link>);
}
