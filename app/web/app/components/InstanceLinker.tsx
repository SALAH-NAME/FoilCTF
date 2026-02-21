import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	api_sandbox_images_list,
	api_sandbox_image_create,
	api_sandbox_image_build,
} from '../api';
import Button from './Button';
import Icon from './Icon';
import Spinner from './Spinner';
import { fmtImageName } from '../utils';

interface InstanceLinkerProps {
	selectedImage: string;
	onSelectImage: (imageName: string) => void;
	disabled?: boolean;
}

export default function InstanceLinker({
	selectedImage,
	onSelectImage,
	disabled = false,
}: InstanceLinkerProps) {
	const [instanceName, setInstanceName] = useState('');
	const queryClient = useQueryClient();

	const { data: imagesData, isLoading: imagesLoading } = useQuery({
		queryKey: ['sandbox-images'],
		queryFn: async () => {
			const result = await api_sandbox_images_list();
			return (result.images ?? []) as Array<{
				id: string;
				names: string[];
				size: number;
			}>;
		},
		initialData: [],
	});

	const mutCreate = useMutation({
		mutationFn: async (body: FormData): Promise<void> => {
			await api_sandbox_image_create(body);
			const name = (body.get('name') as string) ?? '';
			await api_sandbox_image_build(name);
		},
		onSuccess: (_data, variables) => {
			const name = (variables.get('name') as string) ?? '';
			queryClient.invalidateQueries({ queryKey: ['sandbox-images'] });
			onSelectImage(name);
		},
	});

	const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (disabled || mutCreate.status === 'pending') return;
		const form = e.currentTarget;
		if (!form.checkValidity()) return;
		mutCreate.mutate(new FormData(form));
	};

	// Find full image info for the currently linked image
	const linkedImage = selectedImage
		? (imagesData.find((img) => {
				const [name] = fmtImageName(img.names?.[0] ?? '').split(':');
				return name === selectedImage;
			}) ?? null)
		: null;

	return (
		<div className="space-y-4">
			<div>
				<p className="text-sm font-semibold text-dark mb-2">Linked Instance</p>

				{imagesLoading ? (
					<div className="flex items-center gap-2 py-2">
						<Spinner scale={1} />
						<span className="text-sm text-muted">Loading...</span>
					</div>
				) : selectedImage ? (
					<div className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-primary bg-primary/5">
						<Icon
							name="instance"
							className="size-4 shrink-0 text-primary"
							aria-hidden={true}
						/>
						<span className="text-sm font-medium text-primary flex-1 truncate">
							{selectedImage}
						</span>
						{linkedImage && (
							<span className="text-xs text-muted shrink-0">
								{(linkedImage.size / 1024 / 1024).toFixed(0)} MB
							</span>
						)}
						<button
							type="button"
							onClick={() => onSelectImage('')}
							disabled={disabled}
							aria-label="Unlink instance"
							className="shrink-0 text-muted hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
						>
							<Icon name="close" className="size-4" aria-hidden={true} />
						</button>
					</div>
				) : (
					<p className="text-sm text-muted px-1">No instance linked.</p>
				)}
			</div>

			<div className="border-t border-dark/10 pt-3">
				<p className="text-sm font-semibold text-dark mb-2">
					Create &amp; Link Instance
				</p>
				<form
					id="create-instance-form"
					onSubmit={handleCreateSubmit}
					className="p-4 bg-neutral-50 border border-neutral-300 rounded-md space-y-3"
				>
					<div>
						<label
							htmlFor="new-instance-name"
							className="block text-sm font-semibold text-dark mb-1"
						>
							Image Name
						</label>
						<input
							type="text"
							id="new-instance-name"
							name="name"
							value={instanceName}
							onChange={(e) => setInstanceName(e.target.value)}
							placeholder="e.g. web_challenge_01"
							pattern="[a-z][a-z0-9_]*"
							title="Lowercase letters, numbers, and underscores only. Must start with a letter."
							disabled={disabled || mutCreate.status === 'pending'}
							className="w-full px-4 py-2.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
							aria-describedby="instance-name-hint"
						/>
						<p id="instance-name-hint" className="mt-1 text-xs text-muted">
							Lowercase letters, numbers, and underscores only
						</p>
					</div>

					<div>
						<label
							htmlFor="new-instance-archive"
							className="block text-sm font-semibold text-dark mb-1"
						>
							Container Archive (.tar)
							<span className="ml-1 text-xs font-normal text-muted">
								{instanceName ? '(required)' : '(optional)'}
							</span>
						</label>
						<input
							type="file"
							id="new-instance-archive"
							name="archive"
							accept="application/x-tar"
							disabled={disabled || mutCreate.status === 'pending'}
							required={!!instanceName}
							className="w-fit text-sm file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 focus:outline-none"
						/>
					</div>

					<Button
						type="submit"
						variant="primary"
						size="sm"
						disabled={disabled || mutCreate.status === 'pending'}
					>
						{mutCreate.status === 'pending' ? (
							<>
								<Spinner scale={0.7} />
								Building...
							</>
						) : (
							'Create & Link'
						)}
					</Button>

					{mutCreate.status === 'error' && (
						<p className="text-sm text-red-600" role="alert">
							Failed to create instance. Please check the archive and try again.
						</p>
					)}
				</form>
			</div>
		</div>
	);
}
