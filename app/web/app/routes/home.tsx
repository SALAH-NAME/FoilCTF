import { Link } from 'react-router';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';

import type { Route } from './+types/home';
import { api_challenge_list, api_challenge_create } from '../api';

export function meta({}: Route.MetaArgs) {
	return [{ title: 'FoilCTF - Home' }];
}

function Row({ challenge }) {
	return (
		<tr>
			<td>{challenge?.id ?? 'N/A'}</td>
			<td>{challenge?.name ?? 'N/A'}</td>
			<td>{challenge?.description ?? 'N/A'}</td>
			<td>{challenge?.reward ?? 'N/A'}</td>
			<td>{challenge?.reward_min ?? 'N/A'}</td>
			<td>{challenge?.reward_decrements ? 'Yes' : 'No'}</td>
			<td>{challenge?.reward_first_blood || 'None'}</td>
			<td>
				{typeof challenge.id === 'number' && (
					<Link to={`/challenges/${challenge.id}`}>Edit</Link>
				)}
			</td>
		</tr>
	);
}
function Table({ isPending, isFetching, error, rows }) {
	if (isPending || isFetching) {
		return <h1>Loading</h1>;
	}
	if (error) {
		console.error(error);
		return <h1>Could not fetch challenges data</h1>;
	}
	return (
		<table>
			<thead>
				<tr>
					<th>Id</th>
					<th>Name</th>
					<th>Description</th>
					<th>Reward</th>
					<th>Reward Minimum</th>
					<th>Reward Decrements</th>
					<th>First Blood</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{rows.map((challenge) => (
					<Row key={challenge.id} challenge={challenge} />
				))}
			</tbody>
		</table>
	);
}
export default function Page() {
	const queryClient = useQueryClient();
	const mutationCreateChallenge = useMutation({
		mutationFn: (payload) => {
			return api_challenge_create(payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['challenges'],
			});
		},
	});
	const { isPending, error, data, isFetching } = useQuery({
		queryKey: ['challenges'],
		queryFn: api_challenge_list,
	});

	async function form_submit_challenge_create(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const form = event.target;
		const data = new FormData(form);

		const name = data.get('name') ?? '';
		const description = data.get('description') ?? '';

		const reward = Number(data.get('reward') || 500);
		const reward_min = Number(data.get('reward_min') || 350);
		const reward_decrements = data.get('reward_decrements') === 'on';
		const reward_first_blood = Number(data.get('reward_first_blood') || '100');

		const payload = {
			author_id: 'xenobas',
			name,
			description,
			reward,
			reward_min,
			reward_decrements,
			reward_first_blood,
		};
		const optionals: (keyof typeof payload)[] = [
			'reward_first_blood',
			'reward',
			'reward_min',
			'reward_decrements',
		];
		for (const optional of optionals) {
			console.log(optional, data.get(optional) === null);
			if (data.get(optional) === null) delete payload[optional];
		}

		try {
			const resp = await mutationCreateChallenge.mutateAsync(payload);
			console.log(resp);
		} catch (err) {
			if (err instanceof Error) {
				console.error(err);
				return;
			}

			const {
				errors,
			}: {
				errors: {
					[key in keyof typeof payload]?: string;
				};
			} = err;
			console.error(errors);
		}
	}
	return (
		<>
			<Table
				isPending={isPending}
				isFetching={isFetching}
				error={error}
				rows={data}
			/>
			<hr />
			<form onSubmit={(event) => form_submit_challenge_create(event)}>
				<fieldset>
					<legend>Challenge Creation</legend>
					<fieldset>
						<legend>Display</legend>
						<div>
							<label htmlFor="form_create_name">Title</label>
							<input
								type="text"
								id="form_create_name"
								name="name"
								placeholder="Write a name..."
								required
							/>
						</div>
						<div>
							<label htmlFor="form_create_description">Description</label>
							<textarea
								id="form_create_description"
								name="description"
								placeholder="Write a description..."
								required
							></textarea>
						</div>
					</fieldset>
					<fieldset>
						<legend>Reward Details</legend>
						<div>
							<label htmlFor="form_create_reward">Reward</label>
							<input
								type="number"
								id="form_create_reward"
								name="reward"
								placeholder="Write the initial reward..."
							/>
						</div>

						<div>
							<label htmlFor="form_create_reward_min">Reward Minimum</label>
							<input
								type="number"
								id="form_create_reward_min"
								name="reward_min"
								placeholder="Write the initial reward minimum..."
							/>
						</div>

						<div>
							<label htmlFor="form_create_reward_first_blood">
								First Blood Reward
							</label>
							<input
								type="number"
								id="form_create_reward_first_blood"
								name="reward_first_blood"
								placeholder="Write the reward for first blood solves..."
							/>
						</div>

						<div>
							<label htmlFor="form_create_reward_min">Reward Decrements</label>
							<input
								type="checkbox"
								id="form_create_reward_decrements"
								name="reward_decrements"
							/>
						</div>
					</fieldset>
					<button type="submit" style={{ float: 'right' }}>
						Create
					</button>
				</fieldset>
			</form>
		</>
	);
}
