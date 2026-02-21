import { useEffect, useRef, type ReactNode } from 'react';
import Icon from './Icon';

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	footer?: ReactNode;
	size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({
	isOpen,
	onClose,
	title,
	children,
	footer,
	size = 'md' as const,
}: ModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const onCloseRef = useRef(onClose);

	useEffect(() => {
		onCloseRef.current = onClose;
	}, [onClose]);

	useEffect(() => {
		if (isOpen) {
			const timer = setTimeout(() => {
				const firstInput = modalRef.current?.querySelector<HTMLInputElement>(
					'input, textarea, select'
				);
				if (firstInput) {
					firstInput.focus();
				} else {
					closeButtonRef.current?.focus();
				}
			}, 0);

			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';

			const handleKeyDown = (e: KeyboardEvent) => {
				if (e.key === 'Escape') {
					onCloseRef.current();
				}

				if (e.key === 'Tab') {
					const focusableElements = modalRef.current?.querySelectorAll(
						'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
					);
					if (!focusableElements || focusableElements.length === 0) return;

					const firstElement = focusableElements[0] as HTMLElement;
					const lastElement = focusableElements[
						focusableElements.length - 1
					] as HTMLElement;

					if (e.shiftKey && document.activeElement === firstElement) {
						e.preventDefault();
						lastElement.focus();
					} else if (!e.shiftKey && document.activeElement === lastElement) {
						e.preventDefault();
						firstElement.focus();
					}
				}
			};

			document.addEventListener('keydown', handleKeyDown);

			return () => {
				document.body.style.overflow = '';
				document.removeEventListener('keydown', handleKeyDown);
			};
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl',
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}
		>
			<div
				ref={modalRef}
				className={`bg-white rounded-md w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto shadow-xl  [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-primary [&::-webkit-scrollbar-thumb]:rounded-full`}
			>
				<div className="sticky top-0 bg-white border-b border-dark/10 px-6 py-4 flex items-center justify-between">
					<h2 id="modal-title" className="text-xl font-bold text-dark">
						{title}
					</h2>
					<button
						ref={closeButtonRef}
						type="button"
						onClick={onClose}
						className="hover:bg-primary/20 hover:text-dark text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dark rounded"
						aria-label="Close dialog"
					>
						<Icon
							name="close"
							className="size-5 shrink-0 stroke-3"
							aria-hidden={true}
						/>
					</button>
				</div>
				<div className="px-6 py-4">{children}</div>
				{footer && (
					<div className="sticky bottom-0 bg-white border-t border-dark/10 px-6 py-4">
						{footer}
					</div>
				)}
			</div>
		</div>
	);
}
