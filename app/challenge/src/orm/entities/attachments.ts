import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface attachmentsAttributes {
	id: number;
	contents: object;
}

export type attachmentsPk = 'id';
export type attachmentsId = attachments[attachmentsPk];
export type attachmentsOptionalAttributes = 'id';
export type attachmentsCreationAttributes = Optional<
	attachmentsAttributes,
	attachmentsOptionalAttributes
>;

export class attachments
	extends Model<attachmentsAttributes, attachmentsCreationAttributes>
	implements attachmentsAttributes
{
	id!: number;
	contents!: object;

	static initModel(sequelize: Sequelize.Sequelize): typeof attachments {
		return attachments.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				contents: {
					type: DataTypes.JSON,
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: 'attachments',
				schema: 'public',
				timestamps: false,
				indexes: [
					{
						name: 'attachments_pkey',
						unique: true,
						fields: [{ name: 'id' }],
					},
				],
			}
		);
	}
}
