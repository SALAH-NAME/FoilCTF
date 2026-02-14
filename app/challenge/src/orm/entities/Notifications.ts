import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface notificationsAttributes {
	id: number;
	contents: object;
	created_at: Date;
}

export type notificationsPk = 'id';
export type notificationsId = notifications[notificationsPk];
export type notificationsOptionalAttributes = 'id' | 'created_at';
export type notificationsCreationAttributes = Optional<
	notificationsAttributes,
	notificationsOptionalAttributes
>;

export class notifications
	extends Model<notificationsAttributes, notificationsCreationAttributes>
	implements notificationsAttributes
{
	id!: number;
	contents!: object;
	created_at!: Date;

	static initModel(sequelize: Sequelize.Sequelize): typeof notifications {
		return notifications.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				contents: {
					type: DataTypes.JSON,
					allowNull: false,
				},
				created_at: {
					type: DataTypes.DATE,
					allowNull: false,
					defaultValue: Sequelize.Sequelize.fn('now'),
				},
			},
			{
				sequelize,
				tableName: 'notifications',
				schema: 'public',
				timestamps: false,
				indexes: [
					{
						name: 'notifications_pkey',
						unique: true,
						fields: [{ name: 'id' }],
					},
				],
			}
		);
	}
}
