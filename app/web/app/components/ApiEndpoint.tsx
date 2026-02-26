import { useState, useId } from 'react';
import type { ReactNode } from 'react';
import ApiMethodBadge, { type HttpMethod } from './ApiMethodBadge';
import ApiCodeBlock from './ApiCodeBlock';
import Icon from './Icon';

interface ApiParam {
	name: string;
	type: string;
	required?: boolean;
	description: string;
}

interface ApiEndpointProps {
	method: HttpMethod;
	path: string;
	summary: string;
	description?: ReactNode;
	auth?: string | null;
	pathParams?: ApiParam[];
	queryParams?: ApiParam[];
	requestExample?: string;
	responseExample: string;
	responseSummary?: string;
}

export default function ApiEndpoint({
	method,
	path,
	summary,
	description,
	auth = null,
	pathParams,
	queryParams,
	requestExample,
	responseExample,
	responseSummary = 'Example response',
}: ApiEndpointProps) {
	const [open, setOpen] = useState(false);
	const headerId = useId();
	const panelId = useId();

	return (
		<div className="border border-neutral-300 rounded-md overflow-hidden bg-surface">
			<button
				type="button"
				id={headerId}
				aria-expanded={open}
				aria-controls={panelId}
				onClick={() => setOpen((v) => !v)}
				className="w-full flex items-center gap-3 p-3 md:p-4 text-left hover:bg-hover-state transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary group bg-background"
			>
				<ApiMethodBadge method={method} />
				<code className="flex-1 font-mono text-sm text-dark break-all">
					{path}
				</code>
				<span className="hidden sm:block text-dark/80 text-sm truncate max-w-xs">
					{summary}
				</span>
				<Icon
					name="chevronDown"
					className={`size-4 text-dark/60 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
				/>
			</button>

			<div
				className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
					open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
				}`}
			>
				<div className="overflow-hidden">
					<div
						id={panelId}
						role="region"
						aria-labelledby={headerId}
						className="border-t border-neutral-300 p-4 md:p-6 space-y-6"
					>
						<div className="space-y-2">
							<p className="font-semibold text-dark text-base">{summary}</p>
							{description && (
								<p className="text-dark/70 text-sm leading-relaxed">
									{description}
								</p>
							)}
						</div>

						<div className="flex items-center gap-2">
							<span className="text-xs font-semibold text-dark/50 uppercase tracking-wider">
								Auth
							</span>
							{auth ? (
								<span className="inline-flex items-center gap-1.5 text-xs font-medium bg-warning/10 text-warning border border-warning/20 rounded px-2 py-0.5">
									<Icon name="warning" className="size-3" />
									{auth}
								</span>
							) : (
								<span className="inline-flex items-center gap-1.5 text-xs font-medium bg-success/10 text-success border border-success/20 rounded px-2 py-0.5">
									<Icon name="check" className="size-3" />
									Public
								</span>
							)}
						</div>

						{pathParams && pathParams.length > 0 && (
							<div>
								<h4 className="text-sm font-semibold text-dark mb-3">
									Path Parameters
								</h4>
								<ParamTable params={pathParams} />
							</div>
						)}

						{queryParams && queryParams.length > 0 && (
							<div>
								<h4 className="text-sm font-semibold text-dark mb-3">
									Query Parameters
								</h4>
								<ParamTable params={queryParams} />
							</div>
						)}

						{requestExample && (
							<div>
								<h4 className="text-sm font-semibold text-dark mb-3">
									Request Body
								</h4>
								<ApiCodeBlock
									code={requestExample}
									language="json"
									label="Request body example"
								/>
							</div>
						)}

						<div>
							<h4 className="text-sm font-semibold text-dark mb-3">
								{responseSummary}
							</h4>
							<ApiCodeBlock
								code={responseExample}
								language="json"
								label="Response example"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function ParamTable({ params }: { params: ApiParam[] }) {
	return (
		<div className="border border-neutral-200 rounded-md overflow-hidden text-sm">
			<table className="w-full border-collapse">
				<thead>
					<tr className="bg-background text-left text-xs font-semibold text-dark/50 uppercase tracking-wider">
						<th scope="col" className="px-4 py-2 font-semibold">
							Name
						</th>
						<th scope="col" className="px-4 py-2 font-semibold">
							Type
						</th>
						<th scope="col" className="px-4 py-2 font-semibold">
							Required
						</th>
						<th scope="col" className="px-4 py-2 font-semibold">
							Description
						</th>
					</tr>
				</thead>
				<tbody>
					{params.map((p) => (
						<tr key={p.name} className="border-t border-neutral-200 align-top">
							<td className="px-4 py-3 font-mono text-primary font-medium whitespace-nowrap">
								{p.name}
							</td>
							<td className="px-4 py-3 font-mono text-dark/60 whitespace-nowrap">
								{p.type}
							</td>
							<td className="px-4 py-3">
								{p.required ? (
									<span className="text-error text-xs font-semibold">Yes</span>
								) : (
									<span className="text-muted text-xs">No</span>
								)}
							</td>
							<td className="px-4 py-3 text-dark/70">{p.description}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
