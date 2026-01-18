import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface challenges_attachmentsAttributes {
	challenge_id: number;
	attachment_id: number;
	name?: string;
}

export type challenges_attachmentsPk = 'challenge_id' | 'attachment_id';
export type challenges_attachmentsId =
	challenges_attachments[challenges_attachmentsPk];
export type challenges_attachmentsOptionalAttributes = 'name';
export type challenges_attachmentsCreationAttributes = Optional<
	challenges_attachmentsAttributes,
	challenges_attachmentsOptionalAttributes
>;

export class challenges_attachments
	extends Model<
		challenges_attachmentsAttributes,
		challenges_attachmentsCreationAttributes
	>
	implements challenges_attachmentsAttributes
{
	challenge_id!: number;
	attachment_id!: number;
	name?: string;

	static initModel(
		sequelize: Sequelize.Sequelize
	): typeof challenges_attachments {
		return challenges_attachments.init(
			{
				challenge_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				attachment_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				name: {
					type: DataTypes.TEXT,
					allowNull: true,
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
