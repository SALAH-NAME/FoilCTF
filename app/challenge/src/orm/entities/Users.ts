import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface usersAttributes {
	id: string;
	password: string;
	created_at: Date;
	banned_until?: Date;
	profile_id?: number;
}

export type usersPk = 'id';
export type usersId = users[usersPk];
export type usersOptionalAttributes =
	| 'created_at'
	| 'banned_until'
	| 'profile_id';
export type usersCreationAttributes = Optional<
	usersAttributes,
	usersOptionalAttributes
>;

export class users
	extends Model<usersAttributes, usersCreationAttributes>
	implements usersAttributes
{
	id!: string;
	password!: string;
	created_at!: Date;
	banned_until?: Date;
	profile_id?: number;

	static initModel(sequelize: Sequelize.Sequelize): typeof users {
		return users.init(
			{
				id: {
					type: DataTypes.STRING(64),
					allowNull: false,
					primaryKey: true,
				},
				password: {
					type: DataTypes.STRING(64),
					allowNull: false,
				},
				created_at: {
					type: DataTypes.DATE,
					allowNull: false,
					defaultValue: Sequelize.Sequelize.fn('now'),
				},
				banned_until: {
					type: DataTypes.DATE,
					allowNull: true,
				},
				profile_id: {
					type: DataTypes.INTEGER,
					allowNull: true,
				},
			},
			{
				sequelize,
				tableName: 'users',
				schema: 'public',
				timestamps: false,
				indexes: [
					{
						name: 'users_pkey',
						unique: true,
						fields: [{ name: 'id' }],
					},
				],
			}
		);
	}
}
