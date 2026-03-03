export default function SkipLink() {
	return (
		<a
			href="#main-content"
			aria-label="Skip navigation and go to the main section"
			className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:font-semibold focus:outline-none focus:ring-2 focus:ring-dark focus:ring-offset-2 focus:ring-offset-primary"
		>
			Skip to main content
		</a>
	);
}
