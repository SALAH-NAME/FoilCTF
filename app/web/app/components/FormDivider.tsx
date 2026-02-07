interface FormDividerProps {
	text?: string;
}

export default function FormDivider({ text = 'OR' }: FormDividerProps) {
	return (
		<div className="relative">
			<div className="absolute inset-0 flex items-center">
				<div className="w-full border-t border-dark/10"></div>
			</div>
			<div className="relative flex justify-center text-sm">
				<span className="px-2 bg-background text-dark/60">{text}</span>
			</div>
		</div>
	);
}
