import Button from './Button';
import Icon from './Icon';

interface InstanceStatusData {
	isRunning: boolean;
	ip?: string;
	port?: number;
	startedAt?: Date;
	expiresAt?: Date;
	isLaunching?: boolean;
}

interface InstanceStatusPanelProps {
	instanceStatus: InstanceStatusData;
	timeRemaining: number;
	onLaunch: () => void;
	onStop: () => void;
}

export default function InstanceStatusPanel({
	instanceStatus,
	timeRemaining,
	onLaunch,
	onStop,
}: InstanceStatusPanelProps) {
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	if (instanceStatus.isLaunching) {
		return (
			<div
				className="bg-amber-50 border border-amber-200 rounded-md p-4"
				role="status"
				aria-live="polite"
			>
				<div className="flex gap-3 items-center">
					<div
						className="animate-spin rounded-full h-5 w-5 border-2 border-amber-600 border-t-transparent"
						aria-hidden="true"
					/>
					<div>
						<p className="font-semibold text-amber-900">
							Launching Instance...
						</p>
						<p className="text-sm text-amber-700 mt-1">
							Your challenge instance is being set up. This may take a few
							moments.
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (instanceStatus.isRunning) {
		return (
			<div
				className="bg-green-50 border border-green-200 rounded-md p-4"
				role="region"
				aria-label="Running instance details"
			>
				<div className="space-y-4 flex flex-col">
					<div className="flex items-start gap-3">
						<div
							className="w-2 h-2 bg-green-600 rounded-full mt-2 shrink-0 animate-pulse"
							aria-hidden="true"
						/>
						<div className="flex-1">
							<p className="font-semibold text-green-900 mb-1">
								Instance Running
							</p>
							<p className="text-sm text-green-700">
								Your challenge instance is active and ready to use.
							</p>
						</div>
					</div>

					<div className="bg-white border border-green-200 rounded-md p-3 space-y-2">
						<div className="flex items-center gap-2">
							<Icon
								name="instance"
								className="size-5 text-green-600"
								aria-hidden={true}
							/>
							<span className="text-sm font-semibold text-dark">
								Connection Details
							</span>
						</div>

						<div className="space-y-1.5 text-sm">
							<div className="flex items-center gap-2">
								<span className="text-muted min-w-16">Address:</span>
								<code
									className="bg-neutral-100 px-2 py-1 rounded font-mono text-xs text-dark flex-1"
									aria-label={`IP address: ${instanceStatus.ip}`}
								>
									{instanceStatus.ip}
								</code>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-muted min-w-16">Port:</span>
								<code
									className="bg-neutral-100 px-2 py-1 rounded font-mono text-xs text-dark flex-1"
									aria-label={`Port: ${instanceStatus.port}`}
								>
									{instanceStatus.port}
								</code>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-muted min-w-16">Full URL:</span>
								<code
									className="bg-neutral-100 px-2 py-1 rounded font-mono text-xs text-dark flex-1"
									aria-label={`Full URL: ${instanceStatus.ip}:${instanceStatus.port}`}
								>
									{instanceStatus.ip}:{instanceStatus.port}
								</code>
							</div>
						</div>
					</div>

					<div
						className="bg-amber-50 border border-amber-200 rounded-md p-3"
						role="timer"
						aria-live="polite"
						aria-atomic="true"
					>
						<div className="flex items-center gap-2 mb-1">
							<Icon
								name="calendar"
								className="size-5 text-amber-600"
								aria-hidden={true}
							/>
							<span className="text-sm font-semibold text-amber-900">
								Time Remaining
							</span>
						</div>
						<p className="text-2xl font-mono font-bold text-amber-900">
							{formatTime(timeRemaining)}
						</p>
						<p className="text-xs text-amber-700 mt-1">
							Instance will automatically stop when timer expires
						</p>
					</div>

					<Button
						variant="danger"
						size="sm"
						onClick={onStop}
						aria-label="Stop instance"
						className="ml-auto right-0 w-fit"
					>
						Stop Instance
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-blue-50 border border-blue-200 rounded-md p-4">
			<div className="flex gap-3">
				<Icon
					name="instance"
					className="size-5 text-blue-600 shrink-0 mt-0.5"
					aria-hidden={true}
				/>
				<div className="flex flex-col">
					<p className="font-semibold text-blue-900 mb-1">Instance Required</p>
					<p className="text-sm text-blue-900 mb-3">
						This challenge requires a dedicated instance to be launched. Click
						the button below to start your challenge environment.
					</p>
					<Button
						variant="primary"
						size="sm"
						onClick={onLaunch}
						aria-label="Launch challenge instance"
						className="ml-auto right-0 w-fit"
					>
						Launch Instance
					</Button>
				</div>
			</div>
		</div>
	);
}
