import { STATUS_CODES } from 'node:http';
import { type ParsedQs } from 'qs';
import { type Response } from 'express';
import {
	check_number,
	check_string,
	parse_errors_count,
	ParseErrors,
	ParseResult,
} from './parse.ts';

export function respondJSON(
	res: Response,
	body: any,
	status_code: StatusCode = 200
) {
	res.header('Content-Type', 'application/json');
	res.status(status_code);
	res.send(JSON.stringify(body));
	res.end();
}

type StatusCode = keyof typeof STATUS_CODES & number;
export function respondStatus(res: Response, status_code: StatusCode = 200) {
	res.status(status_code);
	res.end();
}

interface Pagination {
	limit: number;
	offset: number;
}
interface QueryPagination extends ParsedQs { }
export function parse_pagination(
	query: QueryPagination
): ParseResult<Pagination> {
	const errors: ParseErrors<Pagination> = {};
	errors['limit'] = check_string(query.limit, { allow_undefined: true });
	errors['offset'] = check_string(query.offset, { allow_undefined: true });
	if (parse_errors_count(errors) > 0) return { ok: false, errors };

	const payload: Pagination = {
		limit: 50,
		offset: 0,
	};

	if (typeof query.limit === 'string') {
		payload.limit = Number(query.limit);
		errors['limit'] = check_number(payload.limit, { min: 1, max: 200 });
	}
	if (typeof query.offset === 'string') {
		payload.offset = Number(query.offset);
		errors['offset'] = check_number(payload.offset, { min: 0 });
	}

	return { ok: true, payload };
}
