import Icon from './Icon';

interface SearchInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

export default function SearchInput({
	value,
	onChange,
	placeholder = 'Search...',
}: SearchInputProps) {
	return (
		<div className="relative">
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="w-full pl-10 pr-4 py-2.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
			/>
			<Icon
				name="search"
				className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-dark/40"
			/>
		</div>
	);
}
