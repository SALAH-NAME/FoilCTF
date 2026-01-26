import { Link } from 'react-router';
import type { Route } from './+types/index';

import Sidebar from '../components/Sidebar';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Home' }];
}

export default function Page() {
	return (
		<>
			<header>
				<h1 className="bg-sky-500">TODO: Fill me</h1>
			</header>
			<div className="min-h-screen"></div>
		</>
	);
}
