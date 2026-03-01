import type { SessionUser } from '~/session.server';

import Modal from '~/components/Modal';
import EventForm from '~/components/EventForm';

interface AdminEventModalProps {
	isOpen: boolean;
	onClose: () => void;
	user?: SessionUser;
}

export default function AdminEventModal({
	isOpen,
	onClose,
	user,
}: AdminEventModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Create Event" size="xl">
			<EventForm
				user={user}
				onCancel={onClose}
			/>
		</Modal>
	);
}
