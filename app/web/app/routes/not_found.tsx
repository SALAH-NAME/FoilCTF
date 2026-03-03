import { Link, useLocation } from 'react-router';
import type { Route } from './+types/not_found';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'FoilCTF - Page Not Found' },
		{
			name: 'description',
			content: 'The page you are looking for does not exist.',
		},
	];
}

export default function Page() {
	const { pathname } = useLocation();

	return (
		<main
			id="main-content"
			className="absolute w-full h-full text-dark flex items-center justify-center px-4"
			aria-labelledby="not-found-title"
		>
			<div className="max-w-2xl w-full text-center">
				<p
					className="text-8xl md:text-9xl font-bold text-primary/50 leading-none select-none mb-2"
					aria-hidden="true"
				>
					404
				</p>

				<h1
					id="not-found-title"
					className="text-4xl md:text-5xl font-bold text-dark mb-4 tracking-tight"
				>
					Page not found
				</h1>

				<p className="text-dark/70 text-sm font-mono mb-6 break-all">
					<span className="sr-only">Requested path: </span>
					{pathname}
				</p>

				<p className="text-dark/90 text-lg leading-relaxed mb-10">
					The page you're looking for doesn't exist or has been moved.
				</p>

				<nav
					aria-label="Recovery options"
					className="flex flex-col sm:flex-row items-center justify-center gap-4"
				>
					<Link
						to="/"
						className="inline-block px-8 py-3 border-2 border-dark text-lg font-semibold rounded hover:bg-primary hover:text-white  transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
					>
						Go home
					</Link>
				</nav>
			</div>
		</main>
	);
}
