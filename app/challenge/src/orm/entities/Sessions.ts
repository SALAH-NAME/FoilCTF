import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface sessionsAttributes {
	id: number;
	expiry: Date;
	refreshtoken: string;
	user_id: number;
	created_at?: Date;
}

export type sessionsPk = 'id';
export type sessionsId = sessions[sessionsPk];
export type sessionsOptionalAttributes = 'id' | 'created_at';
export type sessionsCreationAttributes = Optional<
	sessionsAttributes,
	sessionsOptionalAttributes
>;

export class sessions
	extends Model<sessionsAttributes, sessionsCreationAttributes>
	implements sessionsAttributes
{
	id!: number;
	expiry!: Date;
	refreshtoken!: string;
	user_id!: number;
	created_at?: Date;

	static initModel(sequelize: Sequelize.Sequelize): typeof sessions {
		return sessions.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				expiry: {
					type: DataTypes.DATE,
					allowNull: false,
				},
				refreshtoken: {
					type: DataTypes.TEXT,
					allowNull: false,
				},
				user_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
				},
				created_at: {
					type: DataTypes.DATE,
					allowNull: true,
					defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
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
