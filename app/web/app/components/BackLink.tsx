import { Link } from 'react-router';
import Icon from './Icon';

interface BackLinkProps {
	to: string;
	children?: string;
}

export default function BackLink({ to, children = 'Back' }: BackLinkProps) {
	return (
		<Link
			to={to}
			className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors w-fit"
		>
			<Icon name="chevronLeft" className="w-4 h-4" />
			<span>{children}</span>
		</Link>
	);
}
