import { Link } from 'react-router';
import type { Route } from './+types/index';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Home' }];
}

export default function Page() {
	return (
		<div className="min-h-full bg-black flex items-center justify-center px-4">
			<div className="max-w-3xl w-full text-center">
				<h1 className="text-7xl md:text-8xl lg:text-9xl font-bold text-white mb-6 tracking-wide">
					FoilCTF
				</h1>

				<p className="text-gray-300 text-lg md:text-xl mb-8 leading-relaxed">
					CTF hosting platform The goal of this project is to let you create,
					manage
					<br /> and run cybersecurity Capture The Flag (CTF) competitions.
				</p>

				<Link
					to="/register"
					className="inline-block px-8 py-3 border-2 border-white text-white text-lg font-semibold rounded hover:bg-primary hover:text-black transition-colors duration-200"
				>
					Join us NOW
				</Link>
			</div>
		</div>
	);
}
