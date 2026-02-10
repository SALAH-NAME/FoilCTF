interface FilterTab {
	label: string;
	value: string;
	count?: number;
}

interface FilterTabsProps {
	tabs: FilterTab[];
	activeTab: string;
	onChange: (value: string) => void;
}

export default function FilterTabs({
	tabs,
	activeTab,
	onChange,
}: FilterTabsProps) {
	return (
		<div className="flex flex-wrap gap-2 pb-2 scrollbar-hide">
			{tabs.map((tab) => (
				<button
					key={tab.value}
					onClick={() => onChange(tab.value)}
					className={`px-4 py-2 rounded-md font-semibold text-sm whitespace-nowrap transition-colors w-fit ${
						activeTab === tab.value
							? 'bg-primary text-white'
							: 'bg-white border border-dark/20 text-dark hover:border-primary'
					}`}
				>
					{tab.label}
					{tab.count !== undefined && (
						<span
							className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
								activeTab === tab.value ? 'bg-white/20' : 'bg-dark/10'
							}`}
						>
							{tab.count}
						</span>
					)}
				</button>
			))}
		</div>
	);
}
