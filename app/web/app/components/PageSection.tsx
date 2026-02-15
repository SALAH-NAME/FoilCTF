import type { ReactNode } from 'react';

interface PageSectionProps {
	children: ReactNode;
	className?: string;
}

export default function PageSection({
	children,
	className = '',
}: PageSectionProps) {
	return (
		<div
			className={`bg-surface border border-neutral-300 rounded-md p-4 md:p-6 ${className}`}
		>
			{children}
		</div>
	);
}
