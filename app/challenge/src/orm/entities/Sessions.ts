import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface sessionsAttributes {
	id: number;
	token: string;
	expiry: Date;
}

export type sessionsPk = 'id';
export type sessionsId = sessions[sessionsPk];
export type sessionsOptionalAttributes = 'id';
export type sessionsCreationAttributes = Optional<
	sessionsAttributes,
	sessionsOptionalAttributes
>;

export class sessions
	extends Model<sessionsAttributes, sessionsCreationAttributes>
	implements sessionsAttributes
{
	id!: number;
	token!: string;
	expiry!: Date;

	static initModel(sequelize: Sequelize.Sequelize): typeof sessions {
		return sessions.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				token: {
					type: DataTypes.TEXT,
					allowNull: false,
				},
				expiry: {
					type: DataTypes.DATE,
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: 'sessions',
				schema: 'public',
				timestamps: false,
				indexes: [
					{
						name: 'sessions_pkey',
						unique: true,
						fields: [{ name: 'id' }],
					},
				],
			}
		);
	}
}
