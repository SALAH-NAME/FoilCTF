import './Spinner.css';

// REFERENCE(xenobas): https://github.com/n3r4zzurr0/svg-spinners
export default function Component({ scale = 1 }: { scale: number }) {
	const size = (24 * scale).toFixed(0);
	return (
		<svg
			width={size}
			height={size}
			fill="currentColor"
			stroke="currentColor"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<g className="spinner_V8m1">
				<circle cx="12" cy="12" r="9.5" fill="none" strokeWidth="3"></circle>
			</g>
		</svg>
	);
}
