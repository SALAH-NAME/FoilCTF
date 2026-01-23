import { Link } from 'react-router';
import type { Route } from './+types/index';

import Sidebar from '../components/Sidebar.tsx';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Home' }];
}

export default function Page() {
	return (
		<>
			<header>
				<h1 className="bg-sky-500">Challenges</h1>
			</header>
		</>
	);
}
