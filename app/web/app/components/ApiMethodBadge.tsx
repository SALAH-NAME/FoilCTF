export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiMethodBadgeProps {
	method: HttpMethod;
}

const methodStyles: Record<HttpMethod, string> = {
	GET: 'bg-info/10 text-info border-info/20',
	POST: 'bg-success/10 text-success border-success/20',
	PUT: 'bg-warning/10 text-warning border-warning/20',
	PATCH: 'bg-warning/10 text-warning border-warning/20',
	DELETE: 'bg-error/10 text-error border-error/20',
};

export default function ApiMethodBadge({ method }: ApiMethodBadgeProps) {
	return (
		<span
			className={`inline-block text-xs font-bold font-mono px-2.5 py-1 rounded border uppercase tracking-wider select-none ${methodStyles[method]}`}
			aria-label={`HTTP method: ${method}`}
		>
			{method}
		</span>
	);
}
