import type { ReactNode } from 'react';

interface PageHeaderProps {
	title: string;
	action?: ReactNode;
	className?: string;
}

export default function PageHeader({
	title,
	action,
	className = '',
}: PageHeaderProps) {
	return (
		<header className={`flex items-center justify-between p-4 ${className}`}>
			<h1 className="text-5xl font-bold text-dark">{title}</h1>
			{action}
		</header>
	);
}
