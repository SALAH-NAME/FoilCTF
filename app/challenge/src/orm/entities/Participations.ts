import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface participationsAttributes {
	id: number;
	score: number;
	team_id: number;
	challenge_id: number;
	last_attempt_at?: Date;
}

export type participationsPk = 'id';
export type participationsId = participations[participationsPk];
export type participationsOptionalAttributes =
	| 'id'
	| 'score'
	| 'last_attempt_at';
export type participationsCreationAttributes = Optional<
	participationsAttributes,
	participationsOptionalAttributes
>;

export class participations
	extends Model<participationsAttributes, participationsCreationAttributes>
	implements participationsAttributes
{
	id!: number;
	score!: number;
	team_id!: number;
	challenge_id!: number;
	last_attempt_at?: Date;

	static initModel(sequelize: Sequelize.Sequelize): typeof participations {
		return participations.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				score: {
					type: DataTypes.INTEGER,
					allowNull: false,
					defaultValue: 0,
				},
				team_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
				},
				challenge_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
				},
				last_attempt_at: {
					type: DataTypes.DATE,
					allowNull: true,
				},
			},
			{
				sequelize,
				tableName: 'participations',
				schema: 'public',
				timestamps: false,
				indexes: [
					{
						name: 'participations_pkey',
						unique: true,
						fields: [{ name: 'id' }],
					},
				],
			}
		);
	}
}
