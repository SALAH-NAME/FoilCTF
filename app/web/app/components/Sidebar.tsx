import { Link } from 'react-router';

export default function Component() {
	return (
		<div className="col-start-1 col-span-1 row-start-1 row-span-2 border-r">
			<aside className="sticky top-4">
				<Link to="/" className="mt-4">
					<h1 className="text-2xl text-center font-bold">FoilCTF</h1>
				</Link>
				<nav className="flex flex-col gap-2 p-4 min-w-48">
					<Link to="/challenges">Challenges</Link>
					<Link to="/instances">Instances</Link>
				</nav>
			</aside>
		</div>
	);
}
