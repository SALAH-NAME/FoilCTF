import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { challenges as Challenges } from './Challenges.ts';
import { attachments as Attachments } from './Attachments.ts';

export interface challenges_attachmentsAttributes {
	challenge_id: number;
	attachment_id: number;
	name: string;
}

export type challenges_attachmentsPk = 'challenge_id' | 'attachment_id';
export type challenges_attachmentsId =
	challenges_attachments[challenges_attachmentsPk];
export type challenges_attachmentsCreationAttributes =
	challenges_attachmentsAttributes;

export class challenges_attachments
	extends Model<
		challenges_attachmentsAttributes,
		challenges_attachmentsCreationAttributes
	>
	implements challenges_attachmentsAttributes
{
	declare challenge_id: number;
	declare attachment_id: number;
	declare name: string;

	static initModel(
		sequelize: Sequelize.Sequelize
	): typeof challenges_attachments {
		return challenges_attachments.init(
			{
				challenge_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
					references: {
						model: Challenges,
						key: 'challenge_id',
					},
				},
				attachment_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
					references: {
						model: Attachments,
						key: 'attachment_id',
					},
				},
				name: {
					type: DataTypes.TEXT,
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: 'challenges_attachments',
				schema: 'public',
				timestamps: false,
				indexes: [
					{
						name: 'challenges_attachments_pkey',
						unique: true,
						fields: [{ name: 'challenge_id' }, { name: 'attachment_id' }],
					},
				],
			}
		);
	}
}
