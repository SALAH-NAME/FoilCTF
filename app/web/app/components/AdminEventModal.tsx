import { useState } from 'react';
import Modal from './Modal';
import EventForm, { type EventFormData } from './EventForm';

interface AdminEventModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
	/** When provided, the modal operates in edit mode */
	eventId?: string;
	initialData?: Partial<EventFormData>;
}

export default function AdminEventModal({
	isOpen,
	onClose,
	onSuccess,
	eventId,
	initialData,
}: AdminEventModalProps) {
	const isEditMode = !!eventId;
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (data: EventFormData) => {
		setIsSubmitting(true);
		try {
			if (isEditMode) {
				// TODO: Implement
				console.log(`Update event ${eventId} payload:`, data);
			} else {
				// TODO: Implement
				console.log('Create event payload:', data);
			}
			onSuccess?.();
			onClose();
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={isEditMode ? 'Edit Event' : 'Create Event'}
			size="xl"
		>
			<EventForm
				compact
				initialData={isEditMode ? initialData : undefined}
				onSubmit={handleSubmit}
				onCancel={onClose}
				isSubmitting={isSubmitting}
				submitLabel={isEditMode ? 'Update Event' : 'Create Event'}
			/>
		</Modal>
	);
}
