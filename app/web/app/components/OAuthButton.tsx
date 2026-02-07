import Icon from './Icon';

interface OAuthButtonProps {
	text: string;
	onClick: () => void;
	provider?: '42';
}

export default function OAuthButton({
	text,
	onClick,
	provider = '42',
}: OAuthButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="group w-full border-2 border-dark/20 text-background bg-black font-semibold py-2.5 rounded-md hover:bg-dark/5 hover:text-black transition-colors flex items-center justify-center gap-2"
		>
			{text}
			<Icon
				name={provider}
				className="size-5 fill-background group-hover:fill-black"
			/>
		</button>
	);
}
