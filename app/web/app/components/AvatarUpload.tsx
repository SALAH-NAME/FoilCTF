import { useState, useRef, type ChangeEvent } from 'react';
import Icon from './Icon';

interface AvatarUploadProps {
	username: string;
	currentAvatar?: string;
	onAvatarChange?: (file: File | null) => void;
}

export default function AvatarUpload({
	username,
	currentAvatar,
	onAvatarChange,
}: AvatarUploadProps) {
	const [previewUrl, setPreviewUrl] = useState<string | null>(
		currentAvatar || null
	);
	const [isHovered, setIsHovered] = useState(false);
	const [isFocused, setIsFocused] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setPreviewUrl(reader.result as string);
			};
			reader.readAsDataURL(file);
			// TODO: upload immediately
			onAvatarChange?.(file);
		}
	};

	const handleClick = () => {
		fileInputRef.current?.click();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	};

	const showOverlay = isHovered || isFocused;

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
				{previewUrl ? (
					<img
						src={previewUrl}
						alt={`${username}'s avatar`}
						className="w-full h-full object-cover"
					/>
				) : (
					<span className="text-5xl md:text-6xl font-bold text-white">
						{username.charAt(0).toUpperCase()}
					</span>
				)}
				{showOverlay && (
					<div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 transition-opacity">
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
				)}
			</div>
		</div>
	);
}
