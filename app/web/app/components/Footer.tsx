import { Link } from 'react-router';

export default function Component() {
	return (
		<footer className="flex col-start-2 col-span-2 row-start-2 row-span-1 border-t p-2">
			<p className="ml-4 font-bold">FoilCTF - Kodaic</p>
			<span className="ml-auto flex gap-3 mr-4">
				<Link
					to={'/privacy-policy'}
					className="text-dark font-normal hover:underline"
				>
					Privacy Policy
				</Link>
				<Link
					to={'/terms-of-service'}
					className="text-dark font-normal hover:underline"
				>
					Terms of Service
				</Link>
			</span>
		</footer>
	);
}
