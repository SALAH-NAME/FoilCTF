import type { Route } from './+types/dashboard';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Dashboard' }];
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
