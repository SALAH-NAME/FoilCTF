function api_endpoint_challenges(...components: any): URL {
	const origin = import.meta.env.BROWSER_REST_CHALLENGES_ORIGIN;
	const pathRoot = (import.meta.env.BROWSER_REST_CHALLENGES_PATH ?? '').replace(
		/\/+$/g,
		''
	);

	const path = [pathRoot, ...components].join('/');
	return new URL(path, origin);
}
function api_endpoint_sandbox(...components: any): URL {
	const origin = import.meta.env.BROWSER_REST_SANDBOX_ORIGIN;
	const pathRoot = (import.meta.env.BROWSER_REST_SANDBOX_PATH ?? '').replace(
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

export async function api_sandbox_image_create(body: FormData) {
	const name = body.get('name');
	if (!name) throw new Error('Field "name" must not be empty');

	const method = 'POST';
	const endpoint = api_endpoint_sandbox('images', name, 'create');
	const response = await fetch(endpoint, { method, body });

	const is_json = response.headers.get('content-type') === 'application/json';
	if (!response.ok) {
		if (is_json) throw await response.json();
		throw new Error(await response.text());
	}

	return await response.json();
}
export async function api_sandbox_image_build(name: string) {
	if (!name) throw new Error('Field "name" must not be empty');

	const method = 'POST';
	const endpoint = api_endpoint_sandbox('images', name, 'build');
	const response = await fetch(endpoint, { method });

	const is_json = response.headers.get('content-type') === 'application/json';
	if (!response.ok) {
		if (is_json) throw await response.json();
		throw new Error(await response.text());
	}

	return await response.json();
}
export async function api_sandbox_image_inspect(name: string) {
	const method = 'GET';
	const endpoint = api_endpoint_sandbox('images', name);
	const response = await fetch(endpoint, { method });

	const is_json = response.headers.get('content-type') === 'application/json';
	if (!response.ok) {
		if (is_json) throw await response.json();
		throw new Error(await response.text());
	}

	return await response.json();
}
export async function api_sandbox_image_delete(name: string) {
	const method = 'DELETE';
	const endpoint = api_endpoint_sandbox('images', name);
	const response = await fetch(endpoint, { method });

	const is_json = response.headers.get('content-type') === 'application/json';
	if (!response.ok) {
		if (is_json) throw await response.json();
		throw new Error(await response.text());
	}
}
export async function api_sandbox_images_list() {
	const method = 'GET';
	const endpoint = api_endpoint_sandbox('images');
	const response = await fetch(endpoint, { method });

	const is_json = response.headers.get('content-type') === 'application/json';
	if (!response.ok) {
		if (is_json) throw await response.json();
		throw new Error(await response.text());
	}

	return await response.json();
}

export interface APISandboxImage {
	id: string;
	os: string;
	arch: string;
	user?: string;

	config: {
		user?: string;
		labels: string[];

		env?: string[];
		work_dir?: string;
		exposed_ports?: string[];
		volumes?: string[];

		entrypoint?: string[];
		cmd?: string[];
		stop_signal?: string;
	};

	names_history: string[];
	repo_tags?: string[];
	created_at: string;

	size?: number;
	size_virtual?: number;

	version?: string;
	author?: string;
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
export async function api_attachment_create(challId: string | number) {
	const endpoint = api_endpoint_challenges(challId, 'attachments');
	const response = await fetch(endpoint);
	const is_json = response.headers.get('content-type') === 'application/json';

	if (!response.ok) {
		if (is_json) throw await response.json();
		throw new Error(await response.text());
	}
	return await response.json();
}

export async function api_challenge_inspect(id: string | number) {
	const endpoint = api_endpoint_challenges(id);
	const response = await fetch(endpoint);

	if (!response.ok) {
		if (response.headers.get('Content-Type') === 'application/json')
			throw await response.json();
		throw new Error(await response.text());
	}

	return await response.json();
}

export async function api_challenge_update(
	id: string | number,
	payload: {
		is_published?: boolean;
		name?: string;
		description?: string;
		reward?: number;
		reward_min?: number;
		reward_first_blood?: number;
		reward_decrements?: boolean;
	}
) {
	const endpoint = api_endpoint_challenges(id);
	const response = await fetch(endpoint, {
		method: 'PUT',
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
}

export async function api_challenge_delete(id: string | number) {
	const endpoint = api_endpoint_challenges(id);
	const response = await fetch(endpoint, {
		method: 'DELETE',
	});

	if (!response.ok) {
		if (response.headers.get('Content-Type') === 'application/json')
			throw await response.json();
		throw new Error(await response.text());
	}
}

export async function api_attachment_upload(
	challId: string | number,
	payload: { name: string; contents: Record<string, unknown> }
) {
	const endpoint = api_endpoint_challenges(challId, 'attachments');
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		if (response.headers.get('content-type') === 'application/json')
			throw await response.json();
		throw new Error(await response.text());
	}

	return await response.json();
}

export async function api_attachment_remove(
	challId: string | number,
	attachmentId: string | number
) {
	const endpoint = api_endpoint_challenges(
		challId,
		'attachments',
		attachmentId
	);
	const response = await fetch(endpoint, {
		method: 'DELETE',
	});

	if (!response.ok) {
		if (response.headers.get('content-type') === 'application/json')
			throw await response.json();
		throw new Error(await response.text());
	}
}
