import { Link } from 'react-router';
import type { Route } from './+types/welcome';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'Welcome' }];
}

export default function Page() {
	return (<Link to="/">Go back to index page</Link>);
}
