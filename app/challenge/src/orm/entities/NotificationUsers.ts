import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface notification_usersAttributes {
	notification_id: number;
	user_id: number;
	read_at?: Date;
	is_dismissed: boolean;
	is_read: boolean;
}

export type notification_usersPk = 'notification_id' | 'user_id';
export type notification_usersId = notification_users[notification_usersPk];
export type notification_usersOptionalAttributes = 'read_at';
export type notification_usersCreationAttributes = Optional<
	notification_usersAttributes,
	notification_usersOptionalAttributes
>;

export class notification_users
	extends Model<
		notification_usersAttributes,
		notification_usersCreationAttributes
	>
	implements notification_usersAttributes
{
	notification_id!: number;
	user_id!: number;
	read_at?: Date;
	is_dismissed!: boolean;
	is_read!: boolean;

	static initModel(sequelize: Sequelize.Sequelize): typeof notification_users {
		return notification_users.init(
			{
				notification_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				user_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				read_at: {
					type: DataTypes.DATE,
					allowNull: true,
				},
				is_dismissed: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false,
				},
				is_read: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false,
				},
			},
			{
				sequelize,
				tableName: 'notification_users',
				schema: 'public',
				timestamps: false,
				indexes: [
					{
						name: 'notification_users_pkey',
						unique: true,
						fields: [{ name: 'notification_id' }, { name: 'user_id' }],
					},
				],
			}
		);
	}
}
