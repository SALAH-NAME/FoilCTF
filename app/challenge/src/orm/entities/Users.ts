import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface usersAttributes {
	id: number;
	password: string;
	created_at: Date;
	banned_until?: Date;
	email?: string;
	username: string;
	avatar?: string;
	role: string;
	profile_id?: number;
}

export type usersPk = 'id';
export type usersId = users[usersPk];
export type usersOptionalAttributes =
	| 'id'
	| 'created_at'
	| 'banned_until'
	| 'email'
	| 'avatar'
	| 'role'
	| 'profile_id';
export type usersCreationAttributes = Optional<
	usersAttributes,
	usersOptionalAttributes
>;

export class users
	extends Model<usersAttributes, usersCreationAttributes>
	implements usersAttributes
{
	id!: number;
	password!: string;
	created_at!: Date;
	banned_until?: Date;
	email?: string;
	username!: string;
	avatar?: string;
	role!: string;
	profile_id?: number;

	static initModel(sequelize: Sequelize.Sequelize): typeof users {
		return users.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
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
				email: {
					type: DataTypes.TEXT,
					allowNull: true,
				},
				username: {
					type: DataTypes.TEXT,
					allowNull: false,
				},
				avatar: {
					type: DataTypes.TEXT,
					allowNull: true,
				},
				role: {
					type: DataTypes.STRING(64),
					allowNull: false,
					defaultValue: 'user',
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
						name: 'users_email_key',
						unique: true,
						fields: [{ name: 'email' }],
					},
					{
						name: 'users_pkey',
						unique: true,
						fields: [{ name: 'id' }],
					},
					{
						name: 'users_username_key',
						unique: true,
						fields: [{ name: 'username' }],
					},
				],
			}
		);
	}
}
