import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface ctfsAttributes {
	id: number;
	team_members_min: number;
	team_members_max?: number;
}

export type ctfsPk = 'id';
export type ctfsId = ctfs[ctfsPk];
export type ctfsOptionalAttributes =
	| 'id'
	| 'team_members_min'
	| 'team_members_max';
export type ctfsCreationAttributes = Optional<
	ctfsAttributes,
	ctfsOptionalAttributes
>;

export class ctfs
	extends Model<ctfsAttributes, ctfsCreationAttributes>
	implements ctfsAttributes
{
	id!: number;
	team_members_min!: number;
	team_members_max?: number;

	static initModel(sequelize: Sequelize.Sequelize): typeof ctfs {
		return ctfs.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				team_members_min: {
					type: DataTypes.INTEGER,
					allowNull: false,
					defaultValue: 1,
				},
				team_members_max: {
					type: DataTypes.INTEGER,
					allowNull: true,
				},
			},
			{
				sequelize,
				tableName: 'ctfs',
				schema: 'public',
				timestamps: false,
				indexes: [
					{
						name: 'ctfs_pkey',
						unique: true,
						fields: [{ name: 'id' }],
					},
				],
			}
		);
	}
}
