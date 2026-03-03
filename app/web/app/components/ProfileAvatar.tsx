const FALLBACK = "/Default.png";

export interface ProfileAvatarProps {
	avatar: string | null;
	preview?: string | null;
	className?: string;
}

export default function Component({ avatar, preview = null, className = "object-cover" }: ProfileAvatarProps) {
	const src = (avatar ? URL.parse(avatar, import.meta.env.BROWSER_REST_USER_ORIGIN)?.toString() : FALLBACK) ?? FALLBACK;
	return (<img src={preview || src} className={className} onError={(ev) => ev.currentTarget.src = FALLBACK} />);
}
