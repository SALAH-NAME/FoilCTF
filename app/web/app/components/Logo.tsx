interface LogoProps {
	size?: 'sm' | 'md' | 'lg';
	showText?: boolean;
	className?: string;
}

export default function Logo({
	size = 'md',
	showText = true,
	className = '',
}: LogoProps) {
	const sizeClasses = {
		sm: 'w-6 h-6 text-lg',
		md: 'w-8 h-8 text-xl',
		lg: 'w-10 h-10 text-2xl',
	};

	const textSizeClasses = {
		sm: 'text-base',
		md: 'text-lg',
		lg: 'text-xl',
	};

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<div
				className={`${sizeClasses[size]} bg-primary rounded-md flex items-center justify-center text-white font-bold shrink-0`}
			>
				F
			</div>
			<h1
				className={`${textSizeClasses[size]} font-bold text-dark leading-none translate-y-[1.5px] transition-opacity duration-300 ${
					showText ? 'opacity-100 delay-300' : 'opacity-0 w-0 overflow-hidden'
				}`}
			>
				FoilCTF
			</h1>
		</div>
	);
}
