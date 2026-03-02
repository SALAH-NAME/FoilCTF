import { useState, useRef, type ChangeEvent } from 'react';
import Icon from './Icon';
import ProfileAvatar from './ProfileAvatar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '~/contexts/ToastContext';

interface AvatarUploadProps {
	token: string;
	avatar: string | null;
	username: string;
	currentAvatar?: string;
	onAvatarChange?: (file: File | null) => void;
}

export default function AvatarUpload({
	token,
	username,
	avatar,
	currentAvatar,
	onAvatarChange,
}: AvatarUploadProps) {
	const queryClient = useQueryClient();
	const { addToast } = useToast();

	const fileInputRef = useRef<HTMLInputElement>(null);

	const [previewUrl, setPreviewUrl] = useState<string | null>(
		currentAvatar || null
	);
	const [isHovered, setIsHovered] = useState(false);
	const [isFocused, setIsFocused] = useState(false);

	const [uploadShow, setUploadShow] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (uploadShow) return ;

		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setPreviewUrl(reader.result as string);
				mut_upload.mutate({ token, username, file });
			};
			reader.readAsDataURL(file);
			// TODO: upload immediately
			// onAvatarChange?.(file);
		}
	};
	const handleClick = () => {
		if (uploadShow) return ;
		fileInputRef.current?.click();
	};
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();

			if (uploadShow) return ;
			handleClick();
		}
	};

	const showOverlay = uploadShow || isHovered || isFocused;

	type MutationPayload<T> = {
		token?: string | null;
		username?: string | null;
	} & T;
	const mut_upload = useMutation<unknown, Error, MutationPayload<{ file: File | Blob }>>({
		mutationFn({ token, username, file }) {
			if (!token || !username)
				throw new Error('Unauthorized');
			
			const form_data = new FormData();
			form_data.set('avatar', file);
			
			const url = new URL(`/api/profiles/${username}/avatar`, import.meta.env.BROWSER_REST_USER_ORIGIN);
			return new Promise<void>((resolve, reject) => {
				const req = new XMLHttpRequest();
				req.open('POST', url.toString());
				req.setRequestHeader('Authorization', `Bearer ${token}`);

				req.onload = () => {
					const content_type =
						req.getResponseHeader('Content-Type')?.split(';').at(0) ?? 'text/plain';
					if (content_type != 'application/json')
						reject(new Error('Unexpected response format'));

					const json = JSON.parse(req.responseText);

					const req_ok = (req.status >= 200 && req.status < 300);
					if (!req_ok)
						reject(new Error(json.error ?? 'Internal Server Error'));

					resolve();
				};
				req.onerror = () => {
					reject(new Error('Network level failure'));
				}
				req.upload.onprogress = (ev) => {
					setUploadProgress(ev.loaded / ev.total);
				};

				req.send(form_data);
				setUploadShow(true);
			});
		},
		onMutate() {
			setUploadShow(false);
		},
		async onSuccess() {
			await queryClient.invalidateQueries({ queryKey: ['profile'] });
			addToast({
				'variant': 'success',
				'title': 'Avatar uploaded',
				'message': 'Your avatar has been changed successfully'
			});
		},
		onError(err) {
			addToast({
				'variant': 'error',
				'title': 'Avatar upload',
				'message': err.message,
			});
		}
	});
	return (
		<div className="relative group">
			<div
				className={`w-32 h-32 md:w-40 md:h-40 bg-secondary rounded-full flex items-center justify-center shrink-0 overflow-hidden relative cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none`}
				role="button"
				aria-label={`Upload ${username}'s avatar`}
				onClick={handleClick}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				onKeyDown={handleKeyDown}
				tabIndex={0}
			>
				<ProfileAvatar avatar={avatar ?? null} preview={previewUrl} className={ `w-full h-full object-cover ${uploadShow ? "brightness-50 grayscale-50" : ""}` } />
				{showOverlay && (
					<div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 transition-opacity">
						<div className={uploadShow ? "hidden" : "contents"}>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleFileChange}
								className="sr-only"
								id="avatar-upload"
								aria-label="Upload avatar image"
							/>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									handleClick();
								}}
								className="p-2 bg-white rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
								aria-label="Upload new avatar"
							>
								<Icon
									name="camera"
									className="size-5 shrink-0 text-dark"
									aria-hidden={true}
								/>
							</button>
						</div>
						<div className={uploadShow ? "contents" : "hidden"}>
							<p className="text-3xl text-white" aria-label="Avatar upload progress">{(uploadProgress * 100).toFixed(2)}%</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
