import type { Route } from './+types/index';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Not Found' }];
}

export default function Page() {
	return (
		<>
			<header>
				<h1 className="bg-amber-700">404 Not Found</h1>
			</header>
			<div className="min-h-screen"></div>
		</>
	);
}
