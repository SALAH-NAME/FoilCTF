function api_endpoint_challenges(...components: any): URL {
	const origin = import.meta.env.VITE_REST_CHALLENGES_ORIGIN;
	const pathRoot = (import.meta.env.VITE_REST_CHALLENGES_PATH ?? '').replace(
		/\/+$/g,
		''
	);

	const path = [pathRoot, ...components].join('/');
	return new URL(path, origin);
}
function api_endpoint_sandbox(...components: any): URL {
	const origin = import.meta.env.VITE_REST_SANDBOX_ORIGIN;
	const pathRoot = (import.meta.env.VITE_REST_SANDBOX_PATH ?? '').replace(
		/\/+$/g,
		''
	);

	const path = [pathRoot, ...components].join('/');
	return new URL(path, origin);
}

export async function api_challenge_list() {
	const endpoint = api_endpoint_challenges();
	const response = await fetch(endpoint);

	if (!response.ok) {
		if (response.headers.get('Content-Type') === 'application/json')
			throw await response.json();
		throw new Error(await response.text());
	}

	return await response.json();
}
export async function api_challenge_create(payload: {
	author_id: string;
	name: string;
	description: string;
	reward?: number;
	reward_min?: number;
	reward_decrements?: boolean;
	reward_first_blood?: number;
}) {
	const endpoint = api_endpoint_challenges();
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
export async function api_attachment_list(challId: string | number) {
	const endpoint = api_endpoint_challenges(challId, 'attachments');
	const response = await fetch(endpoint);

	if (!response.ok) {
		if (response.headers.get('content-type') === 'application/json')
			throw await response.json();
		throw new Error(await response.text());
	}

	return await response.json();
}

export async function api_instance_create(name: string, archive: File | Blob) {
	const formData = new FormData();
	formData.set('archive', archive);

	const endpoint = api_endpoint_sandbox('images', name, 'create');
	const response = await fetch(endpoint, {
		method: 'POST',
		body: formData,
	});

	if (!response.ok) {
		if (response.headers.get('content-type') === 'application/json')
			throw await response.json();
		throw new Error(await response.text());
	}
	return await response.json();
}
export async function api_attachment_create(challId: string | number) {
	const endpoint = api_endpoint_challenges(challId, 'attachments');
	const response = await fetch(endpoint);
	const is_json = (response.headers.get('content-type') === 'application/json');

	if (!response.ok) {
		if (is_json)
			throw await response.json();
		throw new Error(await response.text());
	}
	return await response.json();
}
