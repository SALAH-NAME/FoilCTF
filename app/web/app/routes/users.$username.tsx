import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Route } from './+types/users.$username';

import { useToast } from '~/contexts/ToastContext';
import { remote_cancel_friend_request, remote_refuse_friend_request, remote_send_friend_request } from '~/routes/friends';

import Icon from '~/components/Icon';
import Button from '~/components/Button';
import StatsCard from '~/components/StatsCard';
import { request_session } from '~/session.server';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Profile' }];
}
export async function loader({ request }: Route.LoaderArgs) {
	const session = await request_session(request);
	return { user: session.get('user') };
}

type RequestPayload<T> = {
	token?: string | null;
} & T;

async function fetch_profile(username: string, token?: string) {
	const headers = new Headers();
	if (token)
		headers.set('Authorization', `Bearer ${token}`);

	const uri = new URL(
		`/api/profiles/${username}`,
		import.meta.env.VITE_REST_USER_ORIGIN
	);
	const res = await fetch(uri, { headers });

	const content_type =
		res.headers.get('Content-Type')?.split(';').at(0) ?? 'text/plain';
	if (content_type !== 'application/json')
		return null;
	if (!res.ok)
		return null;

	const json = await res.json();
	type JSONData_Profile = {
		friend_status: 'none' | 'received' | 'sent' | 'friends';
		avatar: string;
		username: string;

		challenges_solved: number | null;
		events_participated: number | null;
		total_points: number | null;

		bio: string | null | undefined;
		location: string | null | undefined;
		social_media_links: string | null | undefined;
	};
	return json as JSONData_Profile;
}

export default function Page({ params, loaderData }: Route.ComponentProps) {
	const query_profile = useQuery({
		queryKey: ['profile', { username: params.username }, { token: loaderData.user?.token_access } ],
		initialData: null,
		async queryFn(context) {
			const { queryKey } = context;
			const [_key, _username, _token] = queryKey;
			const { token } = _token as { token: string | undefined; username?: undefined; };

			return await fetch_profile(params.username, token);
		},
	});
	const profileData = query_profile.data;

	const { addToast } = useToast();

	const queryClient = useQueryClient();

	const mut_friend_request_send = useMutation<unknown, Error, RequestPayload<{ target: string }>>({
		mutationFn: async ({ token, target }) => {
			if (!token)
				throw new Error('Unauthorized');
			await remote_send_friend_request(token, target);
		},
		async onSuccess() {
			const invalidates = [
				queryClient.invalidateQueries({ queryKey: ['users'] }),
				queryClient.invalidateQueries({ queryKey: ['profile'] }),
			];
			await Promise.all(invalidates);

			addToast({
				variant: 'success',
				title: 'Friend request sent',
				message: '',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Friend request failed',
				message: err.message,
			});
		},
	});
	const handleAddFriend = () => mut_friend_request_send.mutate({ token: loaderData.user?.token_access, target: params.username });

	const mut_friend_request_cancel = useMutation<unknown, Error, RequestPayload<{ target: string }>>({
		mutationFn: async ({ token, target }) => {
			if (!token)
				throw new Error('Unauthorized');
			await remote_cancel_friend_request(token, target);
		},
		async onSuccess() {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['users'] }),
				queryClient.invalidateQueries({ queryKey: ['profile'] }),
			]);

			addToast({
				variant: 'success',
				title: 'Friend request cancel',
				message: '',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Friend request cancel',
				message: err.message,
			});
		},
	});
	const handleCancelRequest = () => mut_friend_request_cancel.mutate({ token: loaderData.user?.token_access, target: params.username });

	const mut_friend_request_refuse = useMutation<unknown, Error, RequestPayload<{ target: string }>>({
		mutationFn: async ({ token, target }) => {
			if (!token)
				throw new Error('Unauthorized');
			await remote_refuse_friend_request(token, target);
		},
		async onSuccess() {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['users'] }),
				queryClient.invalidateQueries({ queryKey: ['profile'] }),
			]);
			addToast({
				variant: 'success',
				title: 'Friend request refused',
				message: '',
			});
		},
		onError(err) {
			addToast({
				variant: 'error',
				title: 'Friend request refuse',
				message: err.message,
			});
		},
	});
	const handleRejectRequest = () => mut_friend_request_refuse.mutate({ token: loaderData.user?.token_access, target: params.username });

	const show_friend_op = (loaderData.user && loaderData.user?.username !== params.username);
	const friend_status: 'none' | 'received' | 'sent' | 'friends' = profileData?.friend_status ?? 'none';
	return ( // TODO(xenobas): Fix the shifting layout issue
		<div className="h-full bg-background p-4">
			<div className="max-w-4xl mx-auto space-y-6">
				<div className="bg-white rounded-md border border-dark/10">
					<div className="md:block flex h-32 md:h-40 px-6 justify-center bg-linear-to-r from-primary to-secondary rounded-t-sm">
						<div className="absolute ring-4 ring-white rounded-full translate-y-1/2">
							<div className="relative group">
								<div
									className={`w-32 h-32 md:w-40 md:h-40 bg-secondary rounded-full flex items-center justify-center shrink-0 overflow-hidden relative focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none`}
									role="button"
									aria-label={`Upload ${profileData?.username}'s avatar`}
									tabIndex={0}
								>
									{false ? (
										<img
											src="#"
											alt={`${profileData?.username}'s avatar`}
											className="w-full h-full object-cover"
										/>
									) : (
										<span className="text-5xl md:text-6xl font-bold text-white">
											{profileData?.username.charAt(0).toUpperCase()}
										</span>
									)}
								</div>
							</div>
						</div>
					</div>
					<div className="px-6 md:px-8 pb-6 md:pb-8 flex items-center flex-col">
						<div className="flex flex-col md:flex-row items-center md:items-end gap-6">
							<div className="flex-1 text-center md:text-left md:pb-2 md:mt-4 mt-16 md:ml-44 ">
								<h1 className="text-3xl md:text-4xl font-bold text-dark mb-1">
									{profileData?.username}
								</h1>
								{profileData?.bio && (
									<p className="text-dark/70 mb-3 max-w-2xl text-sm">
										{profileData.bio}
									</p>
								)}
								<div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-dark/60">
									{profileData?.location && (
										<span className="flex items-center gap-1">
											<Icon
												name="location"
												className="size-4 shrink-0"
												aria-hidden={true}
											/>
											<span>{profileData.location}</span>
										</span>
									)}
									{profileData?.social_media_links && (
										<p
											rel="noopener noreferrer"
											className="flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
										>
											<Icon
												name="link"
												className="size-4 shrink-0"
												aria-hidden={true}
											/>
											<span className="truncate max-w-xs">
												{profileData.social_media_links}
											</span>
										</p>
									)}
								</div>
							</div>
						</div>
						<div className="flex gap-3 mt-4 h-10 md:ml-auto md:mr-0">
							{show_friend_op && friend_status === 'none' && (
								<Button
									variant="primary"
									onClick={handleAddFriend}
									aria-label={`Send friend request to ${profileData?.username}`}
								>
									Add Friend
								</Button>
							)}
							{show_friend_op && friend_status === 'received' && (
								<Button
									variant="secondary"
									onClick={handleRejectRequest}
									aria-label={`Reject friend request from ${profileData?.username}`}
								>
									Reject Request
								</Button>
							)}
							{show_friend_op && friend_status === 'sent' && (
								<Button
									variant="secondary"
									onClick={handleCancelRequest}
									aria-label={`Cancel friend request to ${profileData?.username}`}
								>
									Cancel Request
								</Button>
							)}
							{show_friend_op && friend_status === 'friends' && (
								<div className="flex items-center gap-2 text-primary">
									<Icon name="check" className="size-5" aria-hidden={true} />
									<span className="font-semibold">Friends</span>
								</div>
							)}
						</div>
					</div>
				</div>

				<div
					className="grid grid-cols-1 md:grid-cols-3 gap-4"
					role="region"
					aria-label="Profile Statistics"
				>
					<StatsCard
						value={profileData?.challenges_solved ?? 0}
						label="Challenges Solved"
					/>
					<StatsCard
						value={profileData?.events_participated ?? 0}
						label="Events Participated In"
					/>
					<StatsCard value={profileData?.total_points ?? 0} label="Total Points" />
				</div>
			</div>
		</div>
	);
}
