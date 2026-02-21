import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import Button from './Button';
import FormInput from './FormInput';
import FormToggle from './FormToggle';
import InstanceLinker from './InstanceLinker';
import AttachmentManager, { type AttachmentEntry } from './AttachmentManager';
import Spinner from './Spinner';
import {
	api_challenge_create,
	api_challenge_update,
	api_attachment_list,
	api_attachment_upload,
	api_attachment_remove,
} from '../api';

export interface Challenge {
	id: number;
	is_published: boolean;
	name: string;
	description: string;
	flag: string;
	reward: number;
	reward_min: number;
	reward_first_blood: number;
	reward_decrements: boolean;
	author_id: number;
	created_at: string;
	updated_at: string;
}

interface ChallengeAttachmentEntry extends AttachmentEntry {
	attachment_id?: number;
	challenge_id?: number;
}

interface AdminChallengeModalProps {
	isOpen: boolean;
	onClose: () => void;
	challenge?: Challenge | null;
	onSuccess?: () => void;
}

export default function AdminChallengeModal({
	isOpen,
	onClose,
	challenge,
	onSuccess,
}: AdminChallengeModalProps) {
	const isEditMode = !!challenge;
	const queryClient = useQueryClient();

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [isPublished, setIsPublished] = useState(false);
	const [reward, setReward] = useState('500');
	const [rewardMin, setRewardMin] = useState('300');
	const [rewardFirstBlood, setRewardFirstBlood] = useState('100');
	const [rewardDecrements, setRewardDecrements] = useState(true);
	const [flag, setFlag] = useState('');
	const [instanceImage, setInstanceImage] = useState('');
	const [attachments, setAttachments] = useState<ChallengeAttachmentEntry[]>(
		[]
	);
	const [formError, setFormError] = useState('');

	// Fetch existing attachments in edit mode
	const { data: serverAttachments } = useQuery({
		queryKey: ['challenge-attachments', challenge?.id],
		queryFn: async () => {
			if (!challenge?.id) return [];
			const result = await api_attachment_list(String(challenge.id));
			return (result.attachments ?? []).map((att: any) => ({
				name: att.name,
				id: att.attachment_id,
				attachment_id: att.attachment_id,
				challenge_id: att.challenge_id,
			})) as ChallengeAttachmentEntry[];
		},
		enabled: isOpen && isEditMode,
		initialData: [] as ChallengeAttachmentEntry[],
	});

	// Reset form when modal opens or challenge changes
	useEffect(() => {
		if (isOpen) {
			if (challenge) {
				setName(challenge.name);
				setDescription(challenge.description);
				setFlag(challenge.flag ?? '');
				setIsPublished(challenge.is_published);
				setReward(String(challenge.reward));
				setRewardMin(String(challenge.reward_min));
				setRewardFirstBlood(String(challenge.reward_first_blood));
				setRewardDecrements(challenge.reward_decrements);
				setInstanceImage('');
			} else {
				setName('');
				setDescription('');
				setFlag('');
				setIsPublished(false);
				setReward('500');
				setRewardMin('300');
				setRewardFirstBlood('100');
				setRewardDecrements(true);
				setInstanceImage('');
				setAttachments([]);
			}
			setFormError('');
		}
	}, [isOpen, challenge]);

	// Sync server attachments when loaded
	useEffect(() => {
		if (isEditMode && serverAttachments.length > 0) {
			setAttachments(serverAttachments);
		}
	}, [serverAttachments, isEditMode]);

	const mutCreate = useMutation({
		mutationFn: async () => {
			const payload = {
				name,
				description,
				flag,
				is_published: isPublished,
				reward: Number(reward),
				reward_min: Number(rewardMin),
				reward_first_blood: Number(rewardFirstBlood),
				reward_decrements: rewardDecrements,
				author_id: 1, // TODO: Replace with authenticated user ID
			};

			const result = await api_challenge_create(payload as any);

			// Create attachments for the new challenge
			if (attachments.length > 0 && result.challenge?.id) {
				for (const att of attachments) {
					await api_attachment_upload(result.challenge.id, {
						name: att.name,
						contents: {},
					});
				}
			}

			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['challenges'] });
			onSuccess?.();
			onClose();
		},
		onError: (error: any) => {
			setFormError(
				error?.errors?.[0]?.message ||
					error?.message ||
					'Failed to create challenge'
			);
		},
	});

	const mutUpdate = useMutation({
		mutationFn: async () => {
			if (!challenge) return;

			const payload = {
				name,
				description,
				flag,
				is_published: isPublished,
				reward: Number(reward),
				reward_min: Number(rewardMin),
				reward_first_blood: Number(rewardFirstBlood),
				reward_decrements: rewardDecrements,
			};

			return await api_challenge_update(challenge.id, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['challenges'] });
			onSuccess?.();
			onClose();
		},
		onError: (error: any) => {
			setFormError(
				error?.errors?.[0]?.message ||
					error?.message ||
					'Failed to update challenge'
			);
		},
	});

	const mutDeleteAttachment = useMutation({
		mutationFn: async ({
			challengeId,
			attachmentId,
		}: {
			challengeId: number;
			attachmentId: number;
		}) => {
			await api_attachment_remove(String(challengeId), String(attachmentId));
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['challenge-attachments', challenge?.id],
			});
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			setFormError('Challenge name is required');
			return;
		}

		if (Number(reward) < Number(rewardMin)) {
			setFormError(
				'Base reward must be greater than or equal to minimum reward'
			);
			return;
		}

		setFormError('');
		if (isEditMode) {
			mutUpdate.mutate();
		} else {
			mutCreate.mutate();
		}
	};

	const isPending =
		mutCreate.status === 'pending' || mutUpdate.status === 'pending';

	const handleAddFiles = (files: File[]) => {
		const entries: ChallengeAttachmentEntry[] = files.map((f) => ({
			name: f.name,
			file: f,
		}));
		setAttachments((prev) => [...prev, ...entries]);

		// If editing, also upload to server immediately
		if (isEditMode && challenge) {
			for (const f of files) {
				api_attachment_upload(challenge.id, {
					name: f.name,
					contents: {},
				}).then(() => {
					queryClient.invalidateQueries({
						queryKey: ['challenge-attachments', challenge.id],
					});
				});
			}
		}
	};

	const handleRemoveAttachment = (index: number) => {
		const att = attachments[index];

		// If editing and has server ID, delete from server
		if (isEditMode && challenge && att.attachment_id) {
			mutDeleteAttachment.mutate({
				challengeId: challenge.id,
				attachmentId: att.attachment_id,
			});
		}

		setAttachments((prev) => prev.filter((_, i) => i !== index));
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={isEditMode ? 'Edit Challenge' : 'Create Challenge'}
			size="lg"
			footer={
				<div className="flex items-center gap-3 justify-between">
					{formError && (
						<p className="text-sm text-red-600 flex-1" role="alert">
							{formError}
						</p>
					)}
					<div className="flex gap-3 ml-auto">
						<Button
							type="button"
							variant="secondary"
							onClick={onClose}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							form="challenge-form"
							variant="primary"
							disabled={isPending}
						>
							{isPending ? (
								<>
									<Spinner scale={0.7} />
									Saving...
								</>
							) : isEditMode ? (
								'Update Challenge'
							) : (
								'Create Challenge'
							)}
						</Button>
					</div>
				</div>
			}
		>
			<form id="challenge-form" onSubmit={handleSubmit} className="space-y-6">
				<fieldset>
					<legend className="text-lg font-semibold text-dark mb-3">
						Challenge Details
					</legend>
					<div className="space-y-4">
						<FormInput
							name="challenge-name"
							type="text"
							label="Name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Enter challenge name..."
							required
						/>

						<FormInput
							name="challenge-description"
							type="textarea"
							label="Description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe the challenge objectives, hints, and context..."
							rows={4}
						/>
						<div>
							<label
								htmlFor="challenge-flag"
								className="block text-sm font-semibold text-dark mb-2"
							>
								Flag
							</label>
							<input
								type="text"
								id="challenge-flag"
								value={flag}
								onChange={(e) => setFlag(e.target.value)}
								placeholder="flag{...}"
								disabled={isPending}
								className="w-full px-4 py-2.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors font-mono"
								aria-describedby="flag-help"
							/>
							<p id="flag-help" className="mt-1 text-xs text-muted">
								The exact flag string participants must submit
							</p>
						</div>
						<FormToggle
							name="is_published"
							label="Published"
							description="Make this challenge visible to participants"
							checked={isPublished}
							onChange={setIsPublished}
							disabled={isPending}
						/>
					</div>
				</fieldset>

				<fieldset className="border-t border-dark/10 pt-4">
					<legend className="text-lg font-semibold text-dark mb-3">
						Reward Settings
					</legend>
					<div className="space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div>
								<label
									htmlFor="reward"
									className="block text-sm font-semibold text-dark mb-2"
								>
									Base Reward
								</label>
								<input
									type="number"
									id="reward"
									value={reward}
									onChange={(e) => setReward(e.target.value)}
									min={0}
									disabled={isPending}
									className="w-full px-4 py-2.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
									aria-describedby="reward-help"
								/>
								<p id="reward-help" className="mt-1 text-xs text-muted">
									Initial point value
								</p>
							</div>

							<div>
								<label
									htmlFor="reward_min"
									className="block text-sm font-semibold text-dark mb-2"
								>
									Minimum Reward
								</label>
								<input
									type="number"
									id="reward_min"
									value={rewardMin}
									onChange={(e) => setRewardMin(e.target.value)}
									min={0}
									disabled={isPending}
									className="w-full px-4 py-2.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
									aria-describedby="reward-min-help"
								/>
								<p id="reward-min-help" className="mt-1 text-xs text-muted">
									Floor for dynamic scoring
								</p>
							</div>

							<div>
								<label
									htmlFor="reward_first_blood"
									className="block text-sm font-semibold text-dark mb-2"
								>
									First Blood Bonus
								</label>
								<input
									type="number"
									id="reward_first_blood"
									value={rewardFirstBlood}
									onChange={(e) => setRewardFirstBlood(e.target.value)}
									min={0}
									disabled={isPending}
									className="w-full px-4 py-2.5 rounded-md border border-dark/20 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
									aria-describedby="first-blood-help"
								/>
								<p id="first-blood-help" className="mt-1 text-xs text-muted">
									Bonus for first solver
								</p>
							</div>
						</div>

						<FormToggle
							name="reward_decrements"
							label="Dynamic Scoring"
							description="Reduce reward as more teams solve the challenge"
							checked={rewardDecrements}
							onChange={setRewardDecrements}
							disabled={isPending}
						/>
					</div>
				</fieldset>

				<fieldset className="border-t border-dark/10 pt-4">
					<legend className="text-lg font-semibold text-dark mb-3">
						Instance Configuration
					</legend>
					<InstanceLinker
						selectedImage={instanceImage}
						onSelectImage={setInstanceImage}
						disabled={isPending}
					/>
				</fieldset>

				<fieldset className="border-t border-dark/10 pt-4">
					<legend className="text-lg font-semibold text-dark mb-3">
						Attachments
					</legend>
					<AttachmentManager
						attachments={attachments}
						onAddFiles={handleAddFiles}
						onRemove={handleRemoveAttachment}
						disabled={isPending}
					/>
				</fieldset>
			</form>
		</Modal>
	);
}
