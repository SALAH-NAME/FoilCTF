import {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from 'react';
import ToastContainer from '../components/ToastContainer';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastLink {
	href: string;
	label: string;
}

export interface ToastItem {
	id: string;
	variant: ToastVariant;
	message: string;
	title?: string;
	duration?: number;
	link?: ToastLink;
}

interface ToastContextType {
	toasts: ToastItem[];
	addToast: (toast: Omit<ToastItem, 'id'>) => string;
	removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_VISIBLE = 5;

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);

	const addToast = useCallback((toast: Omit<ToastItem, 'id'>): string => {
		const id = crypto.randomUUID();
		setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { ...toast, id }]);
		return id;
	}, []);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return (
		<ToastContext.Provider value={{ toasts, addToast, removeToast }}>
			{children}
			<ToastContainer toasts={toasts} onRemove={removeToast} />
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) throw new Error('useToast must be used within a ToastProvider');
	return context;
}
