import { users as Users } from './orm/index.ts';
import * as vb from 'valibot';

const author_exists = async (author_id: string): Promise<boolean> => {
	const user = await Users.findByPk(author_id);
	return user !== null;
};

export const schema_challenge_create = vb.pipeAsync(
	vb.objectAsync({
		is_published: vb.optional(vb.boolean(), false),

		name: vb.pipe(vb.string(), vb.trim(), vb.nonEmpty(), vb.maxLength(128)),
		description: vb.optional(
			vb.pipe(vb.string(), vb.trim(), vb.nonEmpty(), vb.maxLength(512))
		),

		reward: vb.optional(vb.number(), 500),
		reward_min: vb.optional(vb.number(), 300),
		reward_first_blood: vb.optional(vb.number(), 100),
		reward_decrements: vb.optional(vb.boolean(), true),

		author_id: vb.pipeAsync(
			vb.string(),
			vb.trim(),
			vb.nonEmpty(),
			vb.maxLength(64),
			vb.checkAsync(author_exists)
		),
	}),
	vb.forward(
		vb.check(
			({ reward, reward_min }) => reward >= reward_min,
			'The initial reward violates requested minimum'
		),
		['reward']
	)
);
export const schema_challenge_update = vb.pipeAsync(
	vb.objectAsync({
		is_published: vb.optional(vb.boolean()),

		name: vb.optional(
			vb.pipe(vb.string(), vb.trim(), vb.nonEmpty(), vb.maxLength(128))
		),
		description: vb.optional(
			vb.pipe(vb.string(), vb.trim(), vb.nonEmpty(), vb.maxLength(512))
		),

		reward: vb.optional(vb.number()),
		reward_min: vb.optional(vb.number()),
		reward_first_blood: vb.optional(vb.number()),
		reward_decrements: vb.optional(vb.boolean()),
	}),
	vb.forward(
		vb.check(({ reward, reward_min }) => {
			if (reward === undefined || reward_min === undefined) {
				return true;
			}
			return reward >= reward_min;
		}, 'The initial reward violates requested minimum'),
		['reward']
	)
);

export const schema_attachment_create = vb.object({
	name: vb.pipe(vb.string(), vb.trim(), vb.nonEmpty(), vb.maxLength(128)),
	contents: vb.record(vb.string(), vb.unknown()),
});

export const schema_pagination = vb.object({
	limit: vb.pipe(vb.optional(vb.string(), '50'), vb.toNumber()),
	offset: vb.pipe(vb.optional(vb.string(), '0'), vb.toNumber()),
});
