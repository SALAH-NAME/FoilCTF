export type Optional<T> = T | undefined | null;

const formatterDateTime = new Intl.DateTimeFormat('en-GB', {
	dateStyle: 'short',
	timeStyle: 'short',
});
export function fmtDateTime(input: Optional<Date | string>): string {
	if (!input) {
		return 'N/A';
	}

	const date = new Date(input);
	return formatterDateTime.format(date);
}

export function fmtImageId(input: Optional<string>): string {
	if (!input) return 'N/A';
	return input.slice(0, 12);
}
export function fmtImageName(input: Optional<string>): string {
	if (!input) return 'N/A';

	const comps = input.split('/');
	return comps.at(-1) ?? 'N/A';
}

const suffixBytes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
export function fmtBytes(input: Optional<number>): string {
	if (typeof input !== 'number') {
		return 'Invalid';
	}

	let index = 0;
	while (input > 1024 && index < suffixBytes.length) {
		input /= 1024;
		index += 1;
	}
	return `${input.toFixed(2)}${suffixBytes[index]}`;
}

export function fmtCapitalize(
	input: string,
	lowerRest: boolean = false
): string {
	let last_is_space = true;

	let output = '';
	for (let i = 0; i < input.length; ++i) {
		if (last_is_space) {
			output += input[i].toUpperCase();
		} else if (lowerRest) {
			output += input[i].toLowerCase();
		} else {
			output += input[i];
		}
		last_is_space = input[i] == ' ' || input[i] == '\t';
	}
	return output;
}
