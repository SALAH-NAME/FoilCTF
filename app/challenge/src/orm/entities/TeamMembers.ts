import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface team_membersAttributes {
	team_id: number;
	member_id: number;
}

export type team_membersPk = 'team_id' | 'member_id';
export type team_membersId = team_members[team_membersPk];
export type team_membersCreationAttributes = team_membersAttributes;

export class team_members
	extends Model<team_membersAttributes, team_membersCreationAttributes>
	implements team_membersAttributes
{
	team_id!: number;
	member_id!: number;

	static initModel(sequelize: Sequelize.Sequelize): typeof team_members {
		return team_members.init(
			{
				team_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				member_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
			},
			{
				sequelize,
				tableName: 'team_members',
				schema: 'public',
				timestamps: false,
				indexes: [
					{
						name: 'team_members_pkey',
						unique: true,
						fields: [{ name: 'team_id' }, { name: 'member_id' }],
					},
				],
			}
		);
	}
}
