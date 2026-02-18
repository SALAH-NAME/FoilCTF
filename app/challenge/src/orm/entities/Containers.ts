import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface containersAttributes {
	id: number;
	participation_id: number;
	ctf_id: number;
	challenge_id: number;
}

export type containersPk = 'id';
export type containersId = containers[containersPk];
export type containersOptionalAttributes = 'id';
export type containersCreationAttributes = Optional<
	containersAttributes,
	containersOptionalAttributes
>;

export class containers
	extends Model<containersAttributes, containersCreationAttributes>
	implements containersAttributes
{
	id!: number;
	participation_id!: number;
	ctf_id!: number;
	challenge_id!: number;

	static initModel(sequelize: Sequelize.Sequelize): typeof containers {
		return containers.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				participation_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
				},
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
				tableName: 'containers',
				schema: 'public',
				timestamps: false,
				indexes: [
					{
						name: 'containers_pkey',
						unique: true,
						fields: [{ name: 'id' }],
					},
				],
			}
		);
	}
}
