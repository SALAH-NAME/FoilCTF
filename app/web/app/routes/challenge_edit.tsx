import { Link } from 'react-router';
import { useState } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';

import type { Route } from './+types/challenge_edit';
import {
	api_attachment_list,
	api_attachment_create,
	api_instance_create,
} from '../api';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'Challenge Editor' }];
}

function Table({ query: { isPending, isFetching, error, data } }) {
	if (isPending || isFetching) {
		return <h1>Loading</h1>;
	}
	if (error) {
		console.error(error);
		return <h1>Could not fetch attachments</h1>;
	}

	const attachments = data.map((x) => ({
		id: x.attachment_id,
		name: x.name,
		contents: x.attachment.contents,
	}));
	return (
		<table>
			<thead>
				<tr>
					<th>Id</th>
					<th>Name</th>
					<th>Contents</th>
				</tr>
			</thead>
			<tbody>
				{attachments.map((x) => (
					<tr key={x.id}>
						<td>{x.id?.toString() ?? 'N/A'}</td>
						<td>{x.name?.toString() ?? 'N/A'}</td>
						<td>{JSON.stringify(x.contents ?? {})}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
function Form({ challId }) {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: (payload) => {
			return api_attachment_create(payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [`challenges#attachments#${challId}`],
			});
		},
	});

	const [name, setName] = useState<string>('');
	const [archive, setArchive] = useState<File | Blob | null>(null);
	const [disabled, setDisabled] = useState<boolean>(false);

	async function onSubmit() {
		event.preventDefault();

		if (disabled) return;
		if (archive === null || name === '') return;

		try {
			setDisabled(true);

			const instanceName = 'challenge_' + String(challId).padStart(3, '0');
			await api_instance_create(instanceName, archive);

			await mutation.mutateAsync({
				name,
				contents: { type: 'SandboxImage', name: instanceName },
			});
		} catch (error) {
			console.error(error);
		} finally {
			setDisabled(false);
		}
	}

	return (
		<form onSubmit={onSubmit}>
			<fieldset>
				<legend>Attachment Create</legend>
				<div>
					<label htmlFor="attachment_create_name">Name</label>
					<input
						type="text"
						id="attachment_create_name"
						name="name"
						placeholder="Write a name..."
						value={name}
						onChange={(event) => setName(event.target.value)}
						disabled={disabled}
						required
					/>
				</div>
				<div>
					<label htmlFor="attachment_create_archive">Archive</label>
					<input
						type="file"
						id="attachment_create_archive"
						name="archive"
						accept="application/x-tar"
						onChange={(event) => setArchive(event.target.files?.[0] ?? null)}
						disabled={disabled}
						required
					/>
				</div>
				<button type="submit" style={{ float: 'right' }} disabled={disabled}>
					Create
				</button>
			</fieldset>
		</form>
	);
}

export default function Page({ params }: Route.ComponentProps) {
	const { challId } = params;

	const queryClient = useQueryClient();
	const query = useQuery({
		queryFn: () => api_attachment_list(challId),
		queryKey: [`challenges#attachments#${challId}`],
	});
	return (
		<>
			<Table query={query} />
			<hr />
			<Form challId={challId} />
			<hr />
			<Link to="/">Go back to the index page</Link>
		</>
	);
}
