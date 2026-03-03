import type { ReactNode } from 'react';

interface LegalDocumentProps {
	title: string;
	lastUpdated: string;
	children: ReactNode;
}

export function LegalDocument({
	title,
	lastUpdated,
	children,
}: LegalDocumentProps) {
	return (
		<div className="h-full bg-background p-4 md:p-8 overflow-auto">
			<div className="max-w-4xl mx-auto bg-white rounded-md p-6 md:p-10 border border-dark/10">
				<h1 className="text-4xl font-bold text-dark mb-2">{title}</h1>
				<p className="text-dark/60 mb-8">Last updated: {lastUpdated}</p>
				{children}
			</div>
		</div>
	);
}

interface SectionProps {
	id: string;
	title: string;
	children: ReactNode;
}

export function Section({ id, title, children }: SectionProps) {
	return (
		<section className="mb-8" aria-labelledby={id}>
			<h2 id={id} className="text-2xl font-bold text-dark mb-4">
				{title}
			</h2>
			{children}
		</section>
	);
}

interface SubsectionProps {
	title: string;
	children: ReactNode;
	className?: string;
}

export function Subsection({
	title,
	children,
	className = '',
}: SubsectionProps) {
	return (
		<>
			<h3 className={`text-xl font-semibold text-dark mb-3 ${className}`}>
				{title}
			</h3>
			{children}
		</>
	);
}

interface ParagraphProps {
	children: ReactNode;
	className?: string;
}

export function Paragraph({ children, className = '' }: ParagraphProps) {
	return (
		<p className={`text-dark/80 leading-relaxed ${className}`}>{children}</p>
	);
}

interface ListProps {
	items: ReactNode[];
	className?: string;
}

export function List({ items, className = '' }: ListProps) {
	return (
		<ul
			className={`list-disc list-inside text-dark/80 leading-relaxed space-y-2 ${className}`}
		>
			{items.map((item, index) => (
				<li key={index}>{item}</li>
			))}
		</ul>
	);
}
