import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface profilesAttributes {
	id: number;
	name: string;
	image?: string;
}

export type profilesPk = 'id';
export type profilesId = profiles[profilesPk];
export type profilesOptionalAttributes = 'id' | 'image';
export type profilesCreationAttributes = Optional<
	profilesAttributes,
	profilesOptionalAttributes
>;

export class profiles
	extends Model<profilesAttributes, profilesCreationAttributes>
	implements profilesAttributes
{
	id!: number;
	name!: string;
	image?: string;

	static initModel(sequelize: Sequelize.Sequelize): typeof profiles {
		return profiles.init(
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
				image: {
					type: DataTypes.TEXT,
					allowNull: true,
				},
			},
			{
				sequelize,
				tableName: 'profiles',
				schema: 'public',
				timestamps: false,
				indexes: [
					{
						name: 'profiles_pkey',
						unique: true,
						fields: [{ name: 'id' }],
					},
				],
			}
		);
	}
}
