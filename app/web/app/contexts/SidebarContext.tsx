import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	type ReactNode,
} from 'react';

interface SidebarContextType {
	isExpanded: boolean;
	toggleExpanded: () => void;
	isMobileOpen: boolean;
	toggleMobile: () => void;
	closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
	const [isExpanded, setIsExpanded] = useState(() => {
		if (typeof window === 'undefined') return false;
		const saved = localStorage.getItem('sidebar-expanded');
		return saved !== null ? JSON.parse(saved) : false;
	});

	const [isMobileOpen, setIsMobileOpen] = useState(false);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('sidebar-expanded', JSON.stringify(isExpanded));
		}
	}, [isExpanded]);

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 768) {
				setIsMobileOpen(false);
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const toggleExpanded = useCallback(() => {
		setIsExpanded((prev: boolean) => !prev);
	}, []);

	const toggleMobile = useCallback(() => {
		setIsMobileOpen((prev) => !prev);
	}, []);

	const closeMobile = useCallback(() => {
		setIsMobileOpen(false);
	}, []);

	const value = {
		isExpanded,
		toggleExpanded,
		isMobileOpen,
		toggleMobile,
		closeMobile,
	};

	return (
		<SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
	);
}

export function useSidebar() {
	const context = useContext(SidebarContext);
	if (!context)
		throw new Error('useSidebar must be used within SidebarProvider');
	return context;
}
