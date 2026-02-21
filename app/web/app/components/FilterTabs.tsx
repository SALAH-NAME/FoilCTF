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
		<div
			role="tablist"
			aria-label="Filter by category"
			className="flex flex-wrap gap-2 pb-2 scrollbar-hide"
		>
			{tabs.map((tab) => (
				<button
					key={tab.value}
					role="tab"
					aria-selected={activeTab === tab.value}
					aria-controls={`tabpanel-${tab.value}`}
					onClick={() => onChange(tab.value)}
					className={`px-4 py-2 rounded-md font-semibold text-sm whitespace-nowrap transition-colors w-fit focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
						activeTab === tab.value
							? 'bg-primary text-white'
							: 'bg-white border border-dark/20 text-dark hover:border-primary'
					}`}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}
