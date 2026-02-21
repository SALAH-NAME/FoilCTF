import { useState } from 'react';
import Button from './Button';

interface FlagSubmitFormProps {
	onSubmit: (flag: string) => void;
	disabled?: boolean;
}

export default function FlagSubmitForm({
	onSubmit,
	disabled = false,
}: FlagSubmitFormProps) {
	const [flagValue, setFlagValue] = useState('');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (flagValue.trim()) {
			onSubmit(flagValue);
			setFlagValue('');
		}
	};

	return (
		<div>
			<h3 className="font-semibold text-dark mb-2">Submit Flag</h3>
			<form onSubmit={handleSubmit} className="flex gap-2">
				<label htmlFor="flag-input" className="sr-only">
					Enter flag
				</label>
				<input
					id="flag-input"
					type="text"
					value={flagValue}
					onChange={(e) => setFlagValue(e.target.value)}
					placeholder="flag{...}"
					disabled={disabled}
					className="flex-1 px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-neutral-100 disabled:cursor-not-allowed"
					aria-label="Flag input"
				/>
				<Button
					type="submit"
					variant="primary"
					disabled={disabled || !flagValue.trim()}
					aria-label="Submit flag"
				>
					Submit
				</Button>
			</form>
		</div>
	);
}
