import * as vb from 'valibot';

export const schema_attachment_create = vb.object({
	name: vb.pipe(vb.string(), vb.trim(), vb.nonEmpty(), vb.maxLength(128)),
	contents: vb.record(vb.string(), vb.unknown()),
});
export const schema_pagination = vb.object({
	search: vb.optional(vb.string()),
	status: vb.optional(vb.union([vb.literal("draft"), vb.literal("published")])),
	limit: vb.pipe(vb.optional(vb.string(), '50'), vb.toNumber()),
	offset: vb.pipe(vb.optional(vb.string(), '0'), vb.toNumber()),
});
