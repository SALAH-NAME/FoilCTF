import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface ctfs_challengesAttributes {
	ctf_id: number;
	challenge_id: number;
}

export type ctfs_challengesCreationAttributes = ctfs_challengesAttributes;

export class ctfs_challenges
	extends Model<ctfs_challengesAttributes, ctfs_challengesCreationAttributes>
	implements ctfs_challengesAttributes
{
	ctf_id!: number;
	challenge_id!: number;

	static initModel(sequelize: Sequelize.Sequelize): typeof ctfs_challenges {
		return ctfs_challenges.init(
			{
				ctf_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
				},
				challenge_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: 'ctfs_challenges',
				schema: 'public',
				timestamps: false,
			}
		);
	}
}
