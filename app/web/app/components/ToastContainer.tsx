import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import Toast from './Toast';
import type { ToastItem } from '../contexts/ToastContext';

interface ToastContainerProps {
	toasts: ToastItem[];
	onRemove: (id: string) => void;
}

export default function ToastContainer({
	toasts,
	onRemove,
}: ToastContainerProps) {
	// Guard against SSR, createPortal requires `document`.
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	if (!mounted) return null;

	return createPortal(
		<section
			role="region"
			aria-label="Notifications"
			aria-live="polite"
			className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none"
		>
			{toasts.map((toast) => (
				<div key={toast.id} className="pointer-events-auto">
					<Toast toast={toast} onRemove={onRemove} />
				</div>
			))}
		</section>,
		document.body
	);
}
