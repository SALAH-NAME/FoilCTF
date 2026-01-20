import { Link } from 'react-router';

export function loader() {
	throw new Response('Page not found', { status: 404 });
}
