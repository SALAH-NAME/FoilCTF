import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface challengesAttributes {
	id: number;
	is_published: boolean;
	name: string;
	description: string;
	reward: number;
	reward_min: number;
	reward_first_blood: number;
	reward_decrements: boolean;
	author_id: string;
	created_at: Date;
	updated_at: Date;
}

export type challengesPk = 'id';
export type challengesId = challenges[challengesPk];
export type challengesOptionalAttributes =
	| 'id'
	| 'name'
	| 'description'
	| 'reward'
	| 'reward_min'
	| 'reward_first_blood'
	| 'reward_decrements'
	| 'created_at'
	| 'updated_at';
export type challengesCreationAttributes = Optional<
	challengesAttributes,
	challengesOptionalAttributes
>;

export class challenges
	extends Model<challengesAttributes, challengesCreationAttributes>
	implements challengesAttributes
{
	declare id: number;
	declare is_published: boolean;
	declare name: string;
	declare description: string;
	declare reward: number;
	declare reward_min: number;
	declare reward_first_blood: number;
	declare reward_decrements: boolean;
	declare author_id: string;
	declare created_at: Date;
	declare updated_at: Date;

	static initModel(sequelize: Sequelize.Sequelize): typeof challenges {
		return challenges.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				is_published: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false,
				},
				name: {
					type: DataTypes.TEXT,
					allowNull: false,
					defaultValue: 'Unnamed challenge',
				},
				description: {
					type: DataTypes.TEXT,
					allowNull: false,
					defaultValue: 'No description',
				},
				reward: {
					type: DataTypes.INTEGER,
					allowNull: false,
					defaultValue: 500,
				},
				reward_min: {
					type: DataTypes.INTEGER,
					allowNull: false,
					defaultValue: 350,
				},
				reward_first_blood: {
					type: DataTypes.INTEGER,
					allowNull: false,
					defaultValue: 0,
				},
				reward_decrements: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: true,
				},
				author_id: {
					type: DataTypes.STRING(64),
					allowNull: false,
				},
				created_at: {
					type: DataTypes.DATE,
					allowNull: false,
					defaultValue: Sequelize.Sequelize.fn('now'),
				},
				updated_at: {
					type: DataTypes.DATE,
					allowNull: false,
					defaultValue: Sequelize.Sequelize.fn('now'),
				},
			},
			{
				sequelize,
				tableName: 'challenges',
				schema: 'public',
				timestamps: false,
				indexes: [
					{
						name: 'challenges_pkey',
						unique: true,
						fields: [{ name: 'id' }],
					},
				],
			}
		);
	}
}
