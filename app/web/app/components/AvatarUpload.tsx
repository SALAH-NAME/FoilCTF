import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, type ChangeEvent, useEffect } from 'react';

import Icon from '~/components/Icon';
import ProfileAvatar from '~/components/ProfileAvatar';
import { useToast } from '~/contexts/ToastContext';

interface AvatarUploadProps {
	token: string;
	avatar: string | null;
	setAvatar: (newAvatar: string | null) => void;
	username: string;
	onAvatarChange?: (file: File | null) => void;
}

async function remote_delete_profile_avatar(token: string, username: string) {
	const uri = new URL(
		`/api/profiles/${username}/avatar`,
		import.meta.env.BROWSER_REST_USER_ORIGIN
	);
	const res = await fetch(uri, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		throw new Error('Invalid response format');

	const json = await res.json();
	if (!res.ok) throw new Error(json.error ?? 'Internal server error');
}
export default function AvatarUpload({
	token,
	avatar,
	setAvatar,
	username,
}: AvatarUploadProps) {
	const queryClient = useQueryClient();
	const { addToast } = useToast();

	const fileInputRef = useRef<HTMLInputElement>(null);

	const [isHovered, setIsHovered] = useState(false);
	const [isFocused, setIsFocused] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(avatar);

	const [uploadShow, setUploadShow] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);

	useEffect(() => {
		setPreviewUrl(null);
	}, [avatar]);

	type MutationPayload<T> = {
		token?: string | null;
		username?: string | null;
	} & T;
	const mut_upload = useMutation<unknown, Error, MutationPayload<{ file: File | Blob }>>({
		async mutationFn({ token, username, file }) {
			if (!token || !username)
				throw new Error('Unauthorized');
			
			const form_data = new FormData();
			form_data.set('avatar', file);
			
			const url = new URL(`/api/profiles/${username}/avatar`, import.meta.env.BROWSER_REST_USER_ORIGIN);
			await new Promise<void>((resolve, reject) => {
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
		async onSuccess() {
			await queryClient.invalidateQueries({ queryKey: ['profile'] });
			addToast({
				'variant': 'success',
				'title': 'Avatar uploaded',
				'message': 'Your avatar has been changed successfully'
			});

			setUploadShow(false);
		},
		onError(err) {
			setUploadShow(false);
			addToast({
				'variant': 'error',
				'title': 'Avatar upload',
				'message': err.message,
			});
		}
	});
	const mut_delete = useMutation<unknown, Error, MutationPayload<unknown>>({
		async mutationFn({ token, username }) {
			if (!token || !username)
				throw new Error('Unauthorized');
			await remote_delete_profile_avatar(token, username);
		},
		async onSuccess() {
			await queryClient.invalidateQueries({ queryKey: ['profile', { username }, { token }] });
			setAvatar(null);
			addToast({
				'variant': 'success',
				'title': 'Avatar deleted',
				'message': 'Your avatar has been reset successfully'
			});
		},
		onError(err) {
			addToast({
				'variant': 'error',
				'title': 'Avatar deletion',
				'message': err.message,
			});
		}
	});

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();

			if (uploadShow) return ;
			handleClick();
		}
	};
	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (uploadShow) return ;

		const file = e.target.files?.[0];
		if (file) {
			if (!file.type.startsWith("image/")) {
				addToast({
					variant: 'error',
					title: 'Avatar upload',
					message: 'Avatar must be an image',
				});
				e.target.value = "";
				return ;
			}

			const reader = new FileReader();
			reader.onloadend = () => {
				setPreviewUrl(reader.result as string);
				mut_upload.mutate({ token, username, file });
			};
			reader.readAsDataURL(file);
			// TODO: upload immediately
			// onAvatarChange?.(file);
		}

		e.target.value = "";
	};

	const handleClick = () => {
		if (uploadShow) return ;
		fileInputRef.current?.click();
	};
	const handleDelete = () => {
		mut_delete.mutate({ token, username });
	}
	return (
		<div className="relative">
			<div
				className="w-32 h-32 group md:w-40 md:h-40 bg-secondary rounded-full flex items-center justify-center shrink-0 overflow-hidden relative cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
				role="button"
				aria-label={`Upload ${username}'s avatar`}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				onKeyDown={handleKeyDown}
				tabIndex={0}
			>
				<ProfileAvatar avatar={avatar ?? null} preview={previewUrl} className={ `peer w-full h-full object-cover ${uploadShow ? "brightness-50 grayscale-50" : ""}` } />
				<div className="hidden group-hover:flex absolute inset-0 bg-black/60 flex-col items-center justify-center gap-2 transition-opacity">
					<div className="contents">
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
							className="relative p-2 opacity-75 hover:opacity-100 bg-white rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
							aria-label="Upload new avatar"
						>
							<Icon
								name="camera"
								className="size-5 shrink-0 text-dark"
								aria-hidden={true}
							/>
						</button>
					</div>
					{
						avatar && 
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								handleDelete();
							}}
							className="p-2 opacity-75 hover:opacity-100 bg-white rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
							aria-label="Upload new avatar"
						>
							<Icon
								name="trash"
								className="size-5 shrink-0 text-dark"
								aria-hidden={true}
							/>
						</button>
					}
				</div>
			</div>
			{ uploadShow && <span className="absolute top-0 right-0 px-4 py-1 font-bold rounded-lg shadow-xl bg-primary text-white min-w-20 text-right">{(uploadProgress * 100).toFixed(0)}%</span> }
		</div>
	);
}
