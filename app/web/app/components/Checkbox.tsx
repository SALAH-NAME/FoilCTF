interface ComponentCheckboxProps {
	label: string;
	checked: boolean;

	id?: string;
	className?: string;
	setChecked?: (newChecked: boolean) => void;
};

export default function Component({ checked, label, id, className, setChecked }: ComponentCheckboxProps) {
	const classNameStateful = checked ? "bg-primary text-white" : "bg-white border border-dark/20 text-dark hover:border-primary";
	return (
		<label className={`cursor-pointer px-4 py-2 rounded-md font-semibold text-sm whitespace-nowrap transition-colors w-fit focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${classNameStateful} ${className ?? ''}`} htmlFor={id}>
			<span>{label}</span>
			<input type="checkbox" className="hidden" id={id} checked={checked} onChange={(e) => setChecked?.(e.target.checked)} />
		</label>
	);
}
