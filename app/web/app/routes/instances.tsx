import Icon from '../components/Icon';
import Spinner from '../components/Spinner';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import type { Route } from './+types/index';
import {
	fmtBytes,
	fmtCapitalize,
	fmtDateTime,
	fmtImageId,
	fmtImageName,
} from '../utils';
import {
	type APISandboxImage,
	api_sandbox_image_build,
	api_sandbox_image_create,
	api_sandbox_image_delete,
	api_sandbox_image_inspect,
	api_sandbox_images_list,
} from '../api';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Instances' }];
}

function DialogCreate({
	open,
	triggerClose,
}: {
	open: boolean;
	triggerClose: () => void;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	useEffect(() => {
		// DANGER(xenobas): Obviously this is not needed, and not even good, but a hack is a hack.
		if (ref === null) return;

		if (open) {
			ref?.current?.showModal();
		} else {
			ref?.current?.requestClose();
		}
	}, [open]);

	const queryClient = useQueryClient();
	const mutCreate = useMutation({
		mutationFn: async (body: FormData): Promise<Record<string, any>> => {
			await api_sandbox_image_create(body);

			const name = (body.get('name') as string | undefined) ?? '';
			return await api_sandbox_image_build(name);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['instances'],
			});
			triggerClose();
		},
	});

	const disabled = mutCreate.status === 'pending';
	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (disabled || !(event.target instanceof HTMLFormElement)) return;
		if (!event.target.checkValidity()) return;

		const form = event.target;
		const body = new FormData(form);

		mutCreate.mutate(body);
	}

	return (
		<dialog ref={ref} onClose={triggerClose}>
			<form action="/" className="p-4 flex flex-col gap-4" onSubmit={onSubmit}>
				<fieldset className="border p-4 flex flex-col gap-2">
					<legend className="mx-4">Instance</legend>

					<div className="flex flex-col">
						<label htmlFor="create_name">Name</label>
						<input
							type="text"
							id="create_name"
							name="name"
							placeholder="Write a name for the instance..."
							disabled={disabled}
							required
						/>
					</div>

					<div className="flex flex-col">
						<label htmlFor="create_archive">Archive</label>
						<input
							type="file"
							id="create_archive"
							name="archive"
							accept="application/x-tar"
							disabled={disabled}
							required
						/>
					</div>
				</fieldset>
				<button type="submit" disabled={disabled}>
					Create
				</button>
				{mutCreate.status === 'error' && (
					<label className="text-red-400">
						Check the console for the error
					</label>
				)}
			</form>
		</dialog>
	);
}
function DialogInstance({
	open,
	status,
	instance,
	error,
	triggerClose,
}: {
	open: boolean;
	status: 'pending' | 'error' | 'success';
	instance: APISandboxImage;
	error: Error | null;
	triggerClose: () => void;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	useEffect(() => {
		// DANGER(xenobas): Obviously this is not needed, and not even good, but a hack is a hack.
		if (ref === null) return;

		if (open) {
			ref?.current?.showModal();
		} else {
			ref?.current?.requestClose();
		}
	}, [open]);

	const queryClient = useQueryClient();
	const mutDelete = useMutation({
		mutationFn: async () => {
			const [name] = fmtImageName(instance.names_history?.[0]).split(':');
			if (!name) throw new Error('Unreachable');

			return await api_sandbox_image_delete(name);
		},

		onError: (err) => {
			console.error(err);
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: ['instances'],
			});
			triggerClose();
		},
	});

	const disabled = mutDelete.status === 'pending';
	return (
		<dialog ref={ref} onClose={triggerClose} className="min-w-1/2">
			<div className="flex flex-col gap-2 p-4 w-full h-full">
				<div className="flex flex-row items-center justify-between">
					{status === 'success' && (
						<h1>
							<pre>{instance?.names_history.at(0) ?? 'N/A'}</pre>
						</h1>
					)}
					{status === 'pending' && <h1>Loading</h1>}
					{status === 'error' && <h1>N/A</h1>}
					<button
						type="button"
						className="snippet-icon"
						disabled={disabled}
						onClick={(event) => {
							event.preventDefault();
							triggerClose();
						}}
					>
						<Icon name="close" />
					</button>
				</div>
				<hr />
				{status === 'success' && (
					<>
						<div className="w-full flex-1 grid grid-cols-2 gap-x-8 gap-y-2 px-4 my-2">
							<div className="inline-flex flex-row items-center gap-2">
								<h3 className="font-mono font-semibold">User</h3>
								<h3 className="flex-1 font-mono text-right">
									{instance?.user ?? 'root'}
								</h3>
							</div>
							<div className="inline-flex flex-row items-center gap-2">
								<h3 className="font-mono font-semibold">OS</h3>
								<h3 className="flex-1 font-mono text-right">
									{fmtCapitalize(instance?.os ?? 'N/A')}
								</h3>
							</div>
							<div className="inline-flex flex-row items-center gap-2">
								<h3 className="font-mono font-semibold">Size</h3>
								<h3 className="flex-1 font-mono text-right">
									{fmtBytes(instance?.size)}
								</h3>
							</div>
							<div className="inline-flex flex-row items-center gap-2">
								<h3 className="font-mono font-semibold">Virutal Size</h3>
								<h3 className="flex-1 font-mono text-right">
									{fmtBytes(instance?.size_virtual)}
								</h3>
							</div>
							<div className="inline-flex flex-row items-center gap-2">
								<h3 className="font-mono font-semibold">Version</h3>
								<h3 className="flex-1 font-mono text-right">
									{instance?.version ?? 'N/A'}
								</h3>
							</div>
							<div className="inline-flex flex-row items-center gap-2">
								<h3 className="font-mono font-semibold">Author</h3>
								<h3 className="flex-1 font-mono text-right">
									{instance?.author ?? 'N/A'}
								</h3>
							</div>
						</div>
						<hr />
						<div className="flex flex-row">
							{mutDelete.status === 'error' && (
								<h1 className="text-red-400">
									An error has occurred, please check the console...
								</h1>
							)}
							<button
								type="button"
								className="snippet-icon aspect-auto ml-auto bg-red-600 inline-flex hover:bg-red-700 gap-2"
								disabled={disabled}
								onClick={() => mutDelete.mutate()}
							>
								<span>Delete</span>
								<Icon name="trash" />
							</button>
						</div>
					</>
				)}
				{status === 'error' && (
					<div className="w-full min-h-24 flex-1 flex flex-col items-center justify-center">
						<p className="text-red-400">
							An error has occurred, please check the console...
						</p>
						<pre className="text-sm">{error?.message ?? 'Message N/A'}</pre>
						<pre className="text-sm">{error?.stack ?? 'Stack N/A'}</pre>
					</div>
				)}
				{status === 'pending' && (
					<div className="w-full min-h-24 flex-1 flex flex-col items-center justify-center">
						<span className="mx-auto">
							<Spinner scale={2} />
						</span>
					</div>
				)}
			</div>
		</dialog>
	);
}

function TableList({ onSelect }: { onSelect: (id: string) => void }) {
	interface TableRow {
		id: string;
		names: string[];
		size: number;
		containers: number;
		read_only: boolean;
		dangling: boolean;
		created_at: string;
	}

	const { status, data: rows } = useQuery({
		queryKey: ['instances'],
		queryFn: async function (): Promise<TableRow[]> {
			const { images }: { images: TableRow[] } =
				await api_sandbox_images_list();
			return images;
		},
		initialData: [],
	});
	switch (status) {
		case 'error': {
			return <h1>Query Failed</h1>;
		}
		case 'success': {
			return (
				<table className="text-sm text-center">
					<thead>
						<tr className="border-b">
							<th className="w-[16ch]">ID</th>
							<th className="text-justify">Name</th>
							<th className="w-[16ch]">Size</th>
							<th>Created At</th>
						</tr>
					</thead>
					<tbody>
						{rows.map(({ id, names, size, created_at }) => {
							const [name, ..._rest] = fmtImageName(names?.[0]).split(':');
							return (
								<tr key={id}>
									<td title={id ?? 'Not Available'}>
										<pre>{fmtImageId(id)}</pre>
									</td>
									<td
										title={names?.[0] ?? 'Not Available'}
										className="text-justify"
									>
										<pre>
											{names?.[0] ? (
												<button
													className="snippet-anchor"
													onClick={() => onSelect(name)}
												>
													{name}
												</button>
											) : (
												name
											)}
										</pre>
									</td>
									<td title={size.toString() + ' bytes'}>
										<pre>{fmtBytes(size)}</pre>
									</td>
									<td>
										<pre>{fmtDateTime(created_at)}</pre>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			);
		}
	}
}

export default function Page() {
	const [dialogCreate, setDialogCreate] = useState<boolean>(false);
	const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');

	const query = useQuery({
		queryKey: ['instances', selectedInstanceId],
		queryFn: async function (): Promise<APISandboxImage | null> {
			if (!selectedInstanceId) return null;

			const { image }: { image: APISandboxImage } =
				await api_sandbox_image_inspect(selectedInstanceId);
			return image;
		},
	});

	return (
		<>
			<PageHeader
				title="Instances"
				action={
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setDialogCreate(true)}
						icon={<Icon name="add" />}
					>
						New Instance
					</Button>
				}
			/>
			<TableList onSelect={setSelectedInstanceId} />
			<DialogCreate
				open={dialogCreate}
				triggerClose={() => setDialogCreate(false)}
			/>
			{
				<DialogInstance
					open={!!selectedInstanceId}
					status={query.status}
					error={query.error}
					instance={query.data as APISandboxImage}
					triggerClose={() => setSelectedInstanceId('')}
				/>
			}
		</>
	);
}
