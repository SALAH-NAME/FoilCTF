export function response_is_json(res: Response): boolean {
	const [type] = res.headers.get('Content-Type')?.split(';') ?? [];
	return (type === 'application/json');
}
