import type { ComponentProps } from 'react';
import type { Route } from './+types/api-docs';

import PageHeader from '~/components/PageHeader';
import PageSection from '~/components/PageSection';
import ApiEndpoint from '~/components/ApiEndpoint';
import ApiCodeBlock from '~/components/ApiCodeBlock';
import { API_ENDPOINT_GROUPS } from '~/data/api-endpoints';

interface GroupSectionProps {
	id: string;
	title: string;
	description: string;
	endpoints: ComponentProps<typeof ApiEndpoint>[];
}

function EndpointGroupSection({
	id,
	title,
	description,
	endpoints,
}: GroupSectionProps) {
	return (
		<section aria-labelledby={id} className="space-y-3">
			<div className="space-y-1">
				<h2 id={id} className="text-xl font-bold text-dark">
					{title}
				</h2>
				<p className="text-dark/60 text-sm leading-relaxed">{description}</p>
			</div>
			<div className="space-y-2">
				{endpoints.map((ep) => (
					<ApiEndpoint key={`${ep.method}-${ep.path}`} {...ep} />
				))}
			</div>
		</section>
	);
}

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'FoilCTF - API Documentation' },
		{
			name: 'description',
			content:
				'Public REST API reference for the FoilCTF platform. Explore endpoints for events, challenges, scoreboards, profiles and authentication.',
		},
	];
}

export default function Page() {
	return (
		<div className="h-full bg-background overflow-auto">
			<PageHeader title="API Documentation" />

			<div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
				<PageSection>
					<div className="space-y-4">
						<p className="text-dark/80 leading-relaxed">
							The FoilCTF REST API lets you integrate competition data into your
							own tools, bots, and dashboards. All endpoints return{' '}
							<code className="bg-dark/5 px-1.5 py-0.5 rounded text-sm font-mono">
								application/json
							</code>
							.
						</p>

						<div className="space-y-1">
							<p className="text-xs font-semibold text-dark/40 uppercase tracking-wider">
								Content-Type
							</p>
							<ApiCodeBlock
								code="Content-Type: application/json"
								language="header"
								label="Required header"
							/>
						</div>

						<div
							className="flex gap-3 p-4 bg-info/5 border border-info/20 rounded-md text-sm text-dark/70 leading-relaxed"
							role="note"
							aria-label="Authentication note"
						>
							<p>
								Endpoints marked <strong>Public</strong> require no credentials.
								Protected endpoints require an{' '}
								<code className="bg-dark/5 px-1 rounded font-mono text-xs">
									Authorization: Bearer &lt;token&gt;
								</code>{' '}
								header with a valid JWT access token obtained via{' '}
								<code className="bg-dark/5 px-1 rounded font-mono text-xs">
									POST /api/auth/login
								</code>
								.
							</p>
						</div>
					</div>
				</PageSection>

				<PageSection>
					<div className="space-y-3">
						<h2 className="text-lg font-bold text-dark" id="errors">
							Error Responses
						</h2>
						<p className="text-dark/60 text-sm">
							All errors follow a consistent envelope:
						</p>
						<ApiCodeBlock
							label="Error response shape"
							language="json"
							code={`{
  "error": "event not found",
  "status": 404
}`}
						/>
					</div>
				</PageSection>

				<PageSection className="space-y-8">
					{API_ENDPOINT_GROUPS.map((group, index) => (
						<>
							{index > 0 && (
								<hr
									key={`divider-${group.id}`}
									className="border-neutral-200"
									aria-hidden="true"
								/>
							)}
							<EndpointGroupSection key={group.id} {...group} />
						</>
					))}
				</PageSection>
			</div>
		</div>
	);
}
