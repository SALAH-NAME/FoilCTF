import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface messagesAttributes {
	id: number;
	chatroom_id: number;
	contents: string;
	sent_at: Date;
	writer_id?: string;
}

export type messagesPk = 'id' | 'chatroom_id';
export type messagesId = messages[messagesPk];
export type messagesOptionalAttributes = 'id' | 'sent_at' | 'writer_id';
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
	writer_id?: string;

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
				writer_id: {
					type: DataTypes.STRING(64),
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
