import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from 'react';

interface SidebarContextType {
	isExpanded: boolean;
	toggleExpanded: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
	const [isExpanded, setIsExpanded] = useState(() => {
		if (typeof window === 'undefined') return false;
		const saved = localStorage.getItem('sidebar-expanded');
		return saved !== null ? JSON.parse(saved) : false;
	});

	useEffect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('sidebar-expanded', JSON.stringify(isExpanded));
		}
	}, [isExpanded]);

	const value = {
		isExpanded,
		toggleExpanded: () => setIsExpanded((prev: boolean) => !prev),
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
