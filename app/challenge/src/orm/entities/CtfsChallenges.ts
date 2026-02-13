import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface ctfs_challengesAttributes {
	ctf_id: number;
	challenge_id: number;
	reward: number;
	attempts: number;
	solves: number;
	first_blood_at?: Date;
	first_blood_id?: number;
	container_limits?: object;
	flag: object;
}

export type ctfs_challengesPk = 'ctf_id' | 'challenge_id';
export type ctfs_challengesId = ctfs_challenges[ctfs_challengesPk];
export type ctfs_challengesOptionalAttributes =
	| 'reward'
	| 'attempts'
	| 'solves'
	| 'first_blood_at'
	| 'first_blood_id'
	| 'container_limits';
export type ctfs_challengesCreationAttributes = Optional<
	ctfs_challengesAttributes,
	ctfs_challengesOptionalAttributes
>;

export class ctfs_challenges
	extends Model<ctfs_challengesAttributes, ctfs_challengesCreationAttributes>
	implements ctfs_challengesAttributes
{
	ctf_id!: number;
	challenge_id!: number;
	reward!: number;
	attempts!: number;
	solves!: number;
	first_blood_at?: Date;
	first_blood_id?: number;
	container_limits?: object;
	flag!: object;

	static initModel(sequelize: Sequelize.Sequelize): typeof ctfs_challenges {
		return ctfs_challenges.init(
			{
				ctf_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				challenge_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				reward: {
					type: DataTypes.INTEGER,
					allowNull: false,
					defaultValue: 500,
				},
				attempts: {
					type: DataTypes.INTEGER,
					allowNull: false,
					defaultValue: 0,
				},
				solves: {
					type: DataTypes.INTEGER,
					allowNull: false,
					defaultValue: 0,
				},
				first_blood_at: {
					type: DataTypes.DATE,
					allowNull: true,
				},
				first_blood_id: {
					type: DataTypes.INTEGER,
					allowNull: true,
				},
				container_limits: {
					type: DataTypes.JSON,
					allowNull: true,
				},
				flag: {
					type: DataTypes.JSON,
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: 'ctfs_challenges',
				schema: 'public',
				timestamps: false,
				indexes: [
					{
						name: 'ctfs_challenges_pkey',
						unique: true,
						fields: [{ name: 'ctf_id' }, { name: 'challenge_id' }],
					},
				],
			}
		);
	}
}
