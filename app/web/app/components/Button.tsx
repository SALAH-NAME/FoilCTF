import type { ReactNode, ButtonHTMLAttributes } from 'react';
import Icon from './Icon';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'oauth';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	icon?: ReactNode;
	children: ReactNode;
}

export default function Button({
	variant = 'primary',
	size = 'md',
	icon,
	children,
	className = '',
	...props
}: ButtonProps) {
	const baseStyles =
		'font-semibold rounded-md transition-colors inline-flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

	const variantStyles = {
		primary: 'bg-primary text-white hover:bg-primary/80',
		secondary:
			'bg-transparent border-2 border-primary text-primary hover:underline',
		danger:
			'bg-transparent border-2 border-red-600 text-red-600 hover:underline',
		ghost: 'bg-transparent hover:bg-primary/10 text-dark',
		oauth:
			'group border-2 border-dark/20 text-background bg-black hover:bg-dark/5 hover:text-black',
	};

	const sizeStyles = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-6 py-2.5',
		lg: 'px-8 py-3 text-lg',
	};

	return (
		<button
			className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
			{...props}
		>
			{children}
			{icon}
		</button>
	);
}
