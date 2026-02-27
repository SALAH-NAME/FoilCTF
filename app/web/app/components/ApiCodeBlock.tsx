import { useState } from 'react';
import Icon from './Icon';

interface ApiCodeBlockProps {
	code: string;
	language?: string;
	label?: string;
}

export default function ApiCodeBlock({
	code,
	language = 'json',
	label = 'Code example',
}: ApiCodeBlockProps) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// clipboard not found
		}
	}

	return (
		<div className="relative rounded-md bg-dark text-sm overflow-hidden border border-dark/20">
			<div
				className="flex items-center justify-between px-4 py-2 bg-dark/90 border-b border-white/10"
				aria-hidden="true"
			>
				<span className="text-white/40 text-xs font-mono uppercase tracking-widest">
					{language}
				</span>
				<button
					type="button"
					onClick={handleCopy}
					aria-label={copied ? 'Copied!' : `Copy ${label} to clipboard`}
					className="flex items-center gap-1 bg-tra text-white/90 hover:text-white transition-colors text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-dark rounded px-1 py-1"
				>
					{copied ? (
						<>
							<Icon name="check" className="size-3.5" />
							<span>Copied</span>
						</>
					) : (
						<>
							<Icon name="link" className="size-3.5" />
							<span>Copy</span>
						</>
					)}
				</button>
			</div>
			<pre
				role="region"
				aria-label={label}
				tabIndex={0}
				className="overflow-x-auto p-4 text-white/90 leading-relaxed focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
			>
				<code>{code}</code>
			</pre>
		</div>
	);
}
