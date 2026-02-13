import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface messagesAttributes {
	id: number;
	chatroom_id: number;
	contents: string;
	sent_at: Date;
	edited_at?: Date;
	deleted_at?: Date;
	writer_id?: number;
}

export type messagesPk = 'id' | 'chatroom_id';
export type messagesId = messages[messagesPk];
export type messagesOptionalAttributes =
	| 'id'
	| 'sent_at'
	| 'edited_at'
	| 'deleted_at'
	| 'writer_id';
export type messagesCreationAttributes = Optional<
	messagesAttributes,
	messagesOptionalAttributes
>;

export class messages
	extends Model<messagesAttributes, messagesCreationAttributes>
	implements messagesAttributes
{
	id!: number;
	chatroom_id!: number;
	contents!: string;
	sent_at!: Date;
	edited_at?: Date;
	deleted_at?: Date;
	writer_id?: number;

	static initModel(sequelize: Sequelize.Sequelize): typeof messages {
		return messages.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				chatroom_id: {
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				contents: {
					type: DataTypes.TEXT,
					allowNull: false,
				},
				sent_at: {
					type: DataTypes.DATE,
					allowNull: false,
					defaultValue: Sequelize.Sequelize.fn('now'),
				},
				edited_at: {
					type: DataTypes.DATE,
					allowNull: true,
				},
				deleted_at: {
					type: DataTypes.DATE,
					allowNull: true,
				},
				writer_id: {
					type: DataTypes.INTEGER,
					allowNull: true,
				},
			},
			{
				sequelize,
				tableName: 'messages',
				schema: 'public',
				timestamps: false,
				indexes: [
					{
						name: 'messages_pkey',
						unique: true,
						fields: [{ name: 'id' }, { name: 'chatroom_id' }],
					},
				],
			}
		);
	}
}
