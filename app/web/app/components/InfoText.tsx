import Icon from './Icon';
import type { IconName } from './Icon';

interface InfoTextProps {
	icon: IconName;
	children: React.ReactNode;
	className?: string;
	iconClassName?: string;
}

export default function InfoText({
	icon,
	children,
	className = '',
	iconClassName = 'w-4 h-4',
}: InfoTextProps) {
	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<Icon name={icon} className={iconClassName} />
			<span>{children}</span>
		</div>
	);
}
