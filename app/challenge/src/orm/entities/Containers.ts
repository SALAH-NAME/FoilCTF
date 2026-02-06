import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface containersAttributes {
	id: number;
	name: string;
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
	name!: string;

	static initModel(sequelize: Sequelize.Sequelize): typeof containers {
		return containers.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				name: {
					type: DataTypes.TEXT,
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
