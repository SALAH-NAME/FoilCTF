import {
	useEffect,
	useRef,
	useCallback,
	useState,
	type KeyboardEvent,
} from 'react';
import { Link } from 'react-router';
import Icon, { type IconName } from './Icon';
import type { ToastItem, ToastVariant } from '../contexts/ToastContext';

interface VariantConfig {
	icon: IconName;
	wrapperClass: string;
	iconClass: string;
	progressClass: string;
	label: string;
}

const VARIANT_CONFIG: Record<ToastVariant, VariantConfig> = {
	success: {
		icon: 'check',
		wrapperClass: 'border-success/30',
		iconClass: 'text-success',
		progressClass: 'bg-success',
		label: 'Success',
	},
	error: {
		icon: 'warning',
		wrapperClass: 'border-error/30',
		iconClass: 'text-error',
		progressClass: 'bg-error',
		label: 'Error',
	},
	warning: {
		icon: 'warning',
		wrapperClass: 'border-warning/30',
		iconClass: 'text-warning',
		progressClass: 'bg-warning',
		label: 'Warning',
	},
	info: {
		icon: 'info',
		wrapperClass: 'border-info/30',
		iconClass: 'text-info',
		progressClass: 'bg-info',
		label: 'Information',
	},
};

interface ToastProps {
	toast: ToastItem;
	onRemove: (id: string) => void;
}

export default function Toast({ toast, onRemove }: ToastProps) {
	const { id, variant, message, title, duration = 5000, link } = toast;
	const cfg = VARIANT_CONFIG[variant];

	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const remainingRef = useRef(duration);
	const startedAtRef = useRef(0);

	const [isExiting, setIsExiting] = useState(false);
	const [isPaused, setIsPaused] = useState(false);

	const isAlert = variant === 'error';

	const dismiss = useCallback(() => {
		if (isExiting) return;
		setIsExiting(true);
		setTimeout(() => onRemove(id), 250);
	}, [id, isExiting, onRemove]);

	const clearTimer = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	const startTimer = useCallback(() => {
		if (duration === 0) return;
		clearTimer();
		startedAtRef.current = Date.now();
		timerRef.current = setTimeout(dismiss, remainingRef.current);
	}, [clearTimer, dismiss, duration]);

	const pauseTimer = useCallback(() => {
		if (duration === 0 || timerRef.current === null) return;
		clearTimer();
		remainingRef.current = Math.max(
			0,
			remainingRef.current - (Date.now() - startedAtRef.current)
		);
		setIsPaused(true);
	}, [clearTimer, duration]);

	const resumeTimer = useCallback(() => {
		if (duration === 0 || remainingRef.current <= 0) return;
		setIsPaused(false);
		startTimer();
	}, [duration, startTimer]);

	useEffect(() => {
		startTimer();
		return clearTimer;
	}, [clearTimer, startTimer]);

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === 'Escape') {
			e.stopPropagation();
			dismiss();
		}
	};

	return (
		<div
			role={isAlert ? 'alert' : 'status'}
			aria-live={isAlert ? 'assertive' : 'polite'}
			aria-atomic="true"
			tabIndex={0}
			onMouseEnter={pauseTimer}
			onMouseLeave={resumeTimer}
			onFocus={pauseTimer}
			onBlur={resumeTimer}
			onKeyDown={handleKeyDown}
			className={[
				'relative flex items-start gap-3 w-full max-w-sm',
				'bg-surface border rounded-md shadow-lg p-4 pr-3',
				'transition-all duration-250 ease-in-out',
				'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
				cfg.wrapperClass,
				isExiting
					? 'opacity-0 translate-x-3 scale-95'
					: 'opacity-100 translate-x-0 scale-100 animate-toast-enter',
			].join(' ')}
		>
			<span aria-hidden="true" className={`mt-0.5 shrink-0 ${cfg.iconClass}`}>
				<Icon name={cfg.icon} className="size-5" />
			</span>

			<div className="flex-1 min-w-0 mr-1">
				{title && (
					<p className="font-semibold text-sm leading-tight mb-0.5 text-dark">
						{title}
					</p>
				)}
				<p className="text-sm leading-snug text-dark/80">{message}</p>

				{!title && <span className="sr-only">{cfg.label}</span>}

				{link && (
					<div className="mt-1.5">
						{link.href.startsWith('/') ? (
							<Link
								to={link.href}
								onClick={dismiss}
								className={`inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 transition-opacity hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm ${cfg.iconClass}`}
							>
								{link.label}
								<Icon
									name="chevronRight"
									className="size-3"
									aria-hidden={true}
								/>
							</Link>
						) : (
							<a
								href={link.href}
								target="_blank"
								rel="noopener noreferrer"
								onClick={dismiss}
								className={`inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 transition-opacity hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm ${cfg.iconClass}`}
							>
								<Icon name="link" className="size-3" aria-hidden={true} />
								{link.label}
							</a>
						)}
					</div>
				)}
			</div>

			<button
				type="button"
				onClick={dismiss}
				aria-label="Dismiss notification"
				className="shrink-0 -mt-0.5 p-1 rounded-md text-white hover:text-dark hover:bg-hover-state transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
			>
				<Icon name="close" className="size-4 stroke-2" aria-hidden={true} />
			</button>

			{duration > 0 && (
				<span
					aria-hidden="true"
					className={`absolute bottom-0 left-0 h-0.5 rounded-b-md ${cfg.progressClass}`}
					style={{
						animation: `toast-progress ${duration}ms linear forwards`,
						animationPlayState: isPaused ? 'paused' : 'running',
					}}
				/>
			)}
		</div>
	);
}
