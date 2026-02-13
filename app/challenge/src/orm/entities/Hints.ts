import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface hintsAttributes {
	id: number;
	challenge_id: number;
	penalty: number;
	contents: string;
}

export type hintsPk = 'id';
export type hintsId = hints[hintsPk];
export type hintsOptionalAttributes = 'id' | 'penalty' | 'contents';
export type hintsCreationAttributes = Optional<
	hintsAttributes,
	hintsOptionalAttributes
>;

export class hints
	extends Model<hintsAttributes, hintsCreationAttributes>
	implements hintsAttributes
{
	id!: number;
	challenge_id!: number;
	penalty!: number;
	contents!: string;

	static initModel(sequelize: Sequelize.Sequelize): typeof hints {
		return hints.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				challenge_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
				},
				penalty: {
					type: DataTypes.INTEGER,
					allowNull: false,
					defaultValue: 0,
				},
				contents: {
					type: DataTypes.TEXT,
					allowNull: false,
					defaultValue: 'Empty hint',
				},
			},
			{
				sequelize,
				tableName: 'hints',
				schema: 'public',
				timestamps: false,
				indexes: [
					{
						name: 'hints_pkey',
						unique: true,
						fields: [{ name: 'id' }],
					},
				],
			}
		);
	}
}
