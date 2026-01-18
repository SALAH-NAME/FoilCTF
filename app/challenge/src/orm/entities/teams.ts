import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface teamsAttributes {
	id: number;
	profile_id?: number;
}

export type teamsPk = 'id';
export type teamsId = teams[teamsPk];
export type teamsOptionalAttributes = 'id' | 'profile_id';
export type teamsCreationAttributes = Optional<
	teamsAttributes,
	teamsOptionalAttributes
>;

export class teams
	extends Model<teamsAttributes, teamsCreationAttributes>
	implements teamsAttributes
{
	id!: number;
	profile_id?: number;

	static initModel(sequelize: Sequelize.Sequelize): typeof teams {
		return teams.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				profile_id: {
					type: DataTypes.INTEGER,
					allowNull: true,
				},
			},
			{
				sequelize,
				tableName: 'teams',
				schema: 'public',
				timestamps: false,
				indexes: [
					{
						name: 'teams_pkey',
						unique: true,
						fields: [{ name: 'id' }],
					},
				],
			}
		);
	}
}
