import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface reportsAttributes {
	id: number;
	done: boolean;
	contents: string;
	issued_at: Date;
	issuer_id?: number;
}

export type reportsPk = 'id';
export type reportsId = reports[reportsPk];
export type reportsOptionalAttributes = 'id' | 'issued_at' | 'issuer_id';
export type reportsCreationAttributes = Optional<
	reportsAttributes,
	reportsOptionalAttributes
>;

export class reports
	extends Model<reportsAttributes, reportsCreationAttributes>
	implements reportsAttributes
{
	id!: number;
	done!: boolean;
	contents!: string;
	issued_at!: Date;
	issuer_id?: number;

	static initModel(sequelize: Sequelize.Sequelize): typeof reports {
		return reports.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				done: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false,
				},
				contents: {
					type: DataTypes.TEXT,
					allowNull: false,
				},
				issued_at: {
					type: DataTypes.DATE,
					allowNull: false,
					defaultValue: Sequelize.Sequelize.fn('now'),
				},
				issuer_id: {
					type: DataTypes.INTEGER,
					allowNull: true,
				},
			},
			{
				sequelize,
				tableName: 'reports',
				schema: 'public',
				timestamps: false,
				indexes: [
					{
						name: 'reports_pkey',
						unique: true,
						fields: [{ name: 'id' }],
					},
				],
			}
		);
	}
}
