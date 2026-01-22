function api_endpoint(...components: any): URL {
	const origin = import.meta.env.VITE_REST_CHALLENGES_ORIGIN;
	const pathRoot = (import.meta.env.VITE_REST_CHALLENGES_PATH ?? '').replace(/\/+$/g, '');

	const path = [pathRoot, ...components].join('/');
	return new URL(path, origin);
}

export async function api_challenges_list() {
	const endpoint = api_endpoint();
	const response = await fetch(endpoint);

	if (!response.ok) {
		if (response.headers.get('Content-Type') === 'application/json')
			throw await response.json();
		throw new Error(await response.text());
	}

	return await response.json();
}

export async function api_challenge_create(payload: { author_id: string, name: string, description: string, reward?: number, reward_min?: number, reward_decrements?: boolean, reward_first_blood?: number }) {
	const endpoint = api_endpoint();
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		if (response.headers.get('Content-Type') === 'application/json')
			throw await response.json();
		throw new Error(await response.text());
	}

	return await response.json();
}
