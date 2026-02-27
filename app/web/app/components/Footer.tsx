import { Link } from 'react-router';

export default function Component() {
	return (
		<footer className="flex flex-col sm:flex-row items-center justify-between border-t border-dark/10 p-2 px-4 gap-2">
			<p className="font-bold text-sm sm:text-base">FoilCTF - Kodaic</p>
			<span className="flex flex-wrap gap-3 justify-center">
				<Link
					to={'/privacy-policy'}
					className="text-dark text-sm font-normal hover:underline"
				>
					Privacy Policy
				</Link>
				<Link
					to={'/terms-of-service'}
					className="text-dark text-sm font-normal hover:underline"
				>
					Terms of Service
				</Link>
				<Link
					to={'/api-docs'}
					className="text-dark text-sm font-normal hover:underline"
				>
					API Docs
				</Link>
			</span>
		</footer>
	);
}
