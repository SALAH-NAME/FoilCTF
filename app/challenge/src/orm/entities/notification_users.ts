import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface notification_usersAttributes {
	notification_id: number;
	notified_id: string;
}

export type notification_usersPk = 'notification_id' | 'notified_id';
export type notification_usersId = notification_users[notification_usersPk];
export type notification_usersCreationAttributes = notification_usersAttributes;

export class notification_users
	extends Model<
		notification_usersAttributes,
		notification_usersCreationAttributes
	>
	implements notification_usersAttributes
{
	notification_id!: number;
	notified_id!: string;

	static initModel(sequelize: Sequelize.Sequelize): typeof notification_users {
		return notification_users.init(
			{
				notification_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				notified_id: {
					type: DataTypes.STRING(64),
					allowNull: false,
					primaryKey: true,
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
						fields: [{ name: 'notification_id' }, { name: 'notified_id' }],
					},
				],
			}
		);
	}
}
