import Icon from './Icon';

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	totalItems?: number;
	itemsPerPage: number;
	onPageChange: (page: number) => void;
	onItemsPerPageChange?: (itemsPerPage: number) => void;
	className?: string;
}

export default function Pagination({
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	onPageChange,
	onItemsPerPageChange,
	className,
}: PaginationProps) {
	const startItem = totalItems ? (currentPage - 1) * itemsPerPage + 1 : 0;
	const endItem = totalItems
		? Math.min(currentPage * itemsPerPage, totalItems)
		: 0;

	const getPageNumbers = () => {
		const pages: (number | 'ellipsis')[] = [];
		const delta = 0;

		for (let i = 1; i <= totalPages; i++) {
			if (
				i === 1 ||
				i === totalPages ||
				(i >= currentPage - delta && i <= currentPage + delta)
			) {
				pages.push(i);
			} else if (
				pages[pages.length - 1] !== 'ellipsis' &&
				(i < currentPage - delta || i > currentPage + delta)
			) {
				pages.push('ellipsis');
			}
		}

		return pages;
	};

	const pageNumbers = getPageNumbers();

	return (
		<nav
			aria-label="Pagination"
			className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-dark/10 ${className}`}
		>
			<div className="flex items-center gap-4">
				{totalItems !== undefined && (
					<p className="text-sm text-dark/60">
						Showing{' '}
						<span className="font-semibold text-dark">
							{startItem}-{endItem}
						</span>{' '}
						of <span className="font-semibold text-dark">{totalItems}</span>
					</p>
				)}
				{onItemsPerPageChange && (
					<div className="flex items-center gap-2">
						<label
							htmlFor="items-per-page"
							className="text-sm text-dark/60 whitespace-nowrap"
						>
							Per page:
						</label>
						<select
							id="items-per-page"
							value={itemsPerPage}
							onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
							className="px-3 py-1.5 border border-dark/20 rounded-md text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-white"
							aria-label="Items per page"
						>
							<option value="10">10</option>
							<option value="20">20</option>
							<option value="50">50</option>
							<option value="100">100</option>
						</select>
					</div>
				)}
			</div>

			<div className="flex items-center gap-2">
				<button
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1}
					className="px-3 py-2 border border-dark/20 rounded-md hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
					aria-label="Previous page"
				>
					<Icon
						name="chevronLeft"
						className="size-4 stroke-3"
						aria-hidden={true}
					/>
				</button>

				<div className="flex items-center gap-1" role="list" aria-label="Pages">
					{pageNumbers.map((page, index) =>
						page === 'ellipsis' ? (
							<span
								key={`ellipsis-${index}`}
								className="px-2 py-2 text-dark/60"
								aria-hidden="true"
							>
								...
							</span>
						) : (
							<button
								key={page}
								onClick={() => onPageChange(page)}
								disabled={currentPage === page}
								className={`px-3 py-2 border rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
									currentPage === page
										? 'bg-primary text-white border-primary font-semibold'
										: 'border-dark/20 hover:bg-primary/10'
								}`}
								aria-label={`Page ${page}`}
								aria-current={currentPage === page ? 'page' : undefined}
							>
								{page}
							</button>
						)
					)}
				</div>

				<button
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === totalPages}
					className="px-3 py-2 border border-dark/20 rounded-md hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
					aria-label="Next page"
				>
					<Icon
						name="chevronRight"
						className="size-4 stroke-3"
						aria-hidden={true}
					/>
				</button>
			</div>
		</nav>
	);
}
