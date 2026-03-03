import { useRef } from 'react';
import Button from './Button';
import Icon from './Icon';

export interface AttachmentEntry {
	name: string;
	id?: number;
	file?: File;
}

interface AttachmentManagerProps {
	attachments: AttachmentEntry[];
	onAddFiles: (files: File[]) => void;
	onRemove: (index: number) => void;
	disabled?: boolean;
}

function fmtFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentManager({
	attachments,
	onAddFiles,
	onRemove,
	disabled = false,
}: AttachmentManagerProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		if (files.length === 0) return;
		onAddFiles(files);
		// Reset so the same files can be re-selected if removed and re-added
		e.target.value = '';
	};

	return (
		<div className="space-y-3">
			{attachments.length > 0 ? (
				<ul
					className="space-y-2"
					role="list"
					aria-label="Challenge attachments"
				>
					{attachments.map((att, index) => (
						<li
							key={att.id ?? `local-${index}`}
							className="flex items-center gap-2 p-2 bg-neutral-50 border border-neutral-300 rounded-md"
						>
							<Icon
								name="link"
								className="size-4 text-primary shrink-0"
								aria-hidden={true}
							/>
							<div className="flex-1 min-w-0">
								<span className="block text-sm text-dark font-medium truncate">
									{att.name}
								</span>
								{att.file && (
									<span className="text-xs text-muted">
										{fmtFileSize(att.file.size)}
									</span>
								)}
							</div>
							<button
								type="button"
								onClick={() => onRemove(index)}
								disabled={disabled}
								className="p-1 text-white hover:text-red-500 hover:bg-red-50 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 shrink-0"
								aria-label={`Remove attachment ${att.name}`}
							>
								<Icon
									name="close"
									className="size-4 stroke-3"
									aria-hidden={true}
								/>
							</button>
						</li>
					))}
				</ul>
			) : (
				<p className="text-sm text-muted py-1">No attachments added yet.</p>
			)}

			<input
				ref={inputRef}
				type="file"
				multiple
				className="sr-only"
				aria-hidden={true}
				tabIndex={-1}
				disabled={disabled}
				onChange={handleFileChange}
			/>

			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={() => inputRef.current?.click()}
				disabled={disabled}
				aria-label="Select files to attach"
			>
				<Icon name="add" className="size-4" aria-hidden={true} />
				Add Files
			</Button>
			<p className="text-xs text-muted -mt-1">
				You can select multiple files at once.
			</p>
		</div>
	);
}
