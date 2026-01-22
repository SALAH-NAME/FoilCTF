export type ParseErrors<T> = { [field in 'body' | keyof T]?: string };
export type ParseResult<T> =
	| { ok: true; payload: T }
	| { ok: false; errors: ParseErrors<T> };

export function check_object(x: unknown): string | undefined {
	return x !== null && typeof x === 'object' && !Array.isArray(x)
		? undefined
		: 'Must be an object';
}
export function check_string(
	x: unknown,
	config?: {
		min_length?: number;
		max_length?: number;
		allow_undefined?: boolean;
	}
): string | undefined {
	if (typeof x === 'undefined' && (config?.allow_undefined ?? false))
		return undefined;
	if (typeof x !== 'string') return 'Must be a string';
	if (x.length < (config?.min_length ?? 0)) return 'Too short';
	if (x.length > (config?.max_length ?? Infinity)) return 'Too long';
	return undefined;
}
export function check_number(
	x: unknown,
	config?: { min?: number; max?: number; allow_undefined?: boolean }
): string | undefined {
	if (typeof x === 'undefined' && (config?.allow_undefined ?? false))
		return undefined;
	if (typeof x !== 'number') return 'Must be a number';
	if (x < (config?.min ?? -Infinity)) return 'Too small';
	if (x > (config?.max ?? +Infinity)) return 'Too large';
	return undefined;
}
export function check_boolean(
	x: unknown,
	config?: { allow_undefined?: boolean }
): string | undefined {
	if (typeof x === 'undefined' && (config?.allow_undefined ?? false))
		return undefined;
	if (typeof x !== 'boolean') return 'Must be a boolean';
	return undefined;
}

export function parse_errors_count<T>(errors: ParseErrors<T>): number {
	return Object.values(errors).filter((x) => typeof x === 'string').length;
}
