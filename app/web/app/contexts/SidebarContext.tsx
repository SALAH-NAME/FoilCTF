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
	const [isExpanded, setIsExpanded] = useState(false);
	useEffect(() => {
		const saved = localStorage.getItem('sidebar-expanded');
		setIsExpanded(saved !== null ? JSON.parse(saved) : true);
	}, []);

	const [isMobileOpen, setIsMobileOpen] = useState(false);
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
		setIsExpanded((prev: boolean) => {
			localStorage.setItem('sidebar-expanded', JSON.stringify(!prev));
			return !prev;
		});
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

	return <SidebarContext value={value}>{children}</SidebarContext>;
}

export function useSidebar() {
	const context = useContext(SidebarContext);
	if (!context)
		throw new Error('useSidebar must be used within SidebarProvider');
	return context;
}
