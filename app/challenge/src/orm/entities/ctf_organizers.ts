import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface ctf_organizersAttributes {
	ctf_id: number;
	organizer_id: string;
}

export type ctf_organizersCreationAttributes = ctf_organizersAttributes;

export class ctf_organizers
	extends Model<ctf_organizersAttributes, ctf_organizersCreationAttributes>
	implements ctf_organizersAttributes
{
	ctf_id!: number;
	organizer_id!: string;

	static initModel(sequelize: Sequelize.Sequelize): typeof ctf_organizers {
		return ctf_organizers.init(
			{
				ctf_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
				},
				organizer_id: {
					type: DataTypes.STRING(64),
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: 'ctf_organizers',
				schema: 'public',
				timestamps: false,
			}
		);
	}
}
