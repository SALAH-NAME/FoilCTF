import type { SessionUser } from '~/session.server';

import Modal from '~/components/Modal';
import EventForm from '~/components/EventForm';

interface AdminEventModalProps {
	isOpen: boolean;
	onClose: () => void;
	event_id?: string;
	user?: SessionUser;
}

export default function AdminEventModal({
	isOpen,
	onClose,
	user,
	event_id,
}: AdminEventModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Create Event" size="xl">
			<EventForm
				user={user}
				event_id={event_id}
				onCancel={onClose}
			/>
		</Modal>
	);
}
