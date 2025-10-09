import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	ModelStatic,
} from 'sequelize';

import { sequelize } from '@/lib/config';

export class Tag extends Model<
	InferAttributes<Tag>,
	InferCreationAttributes<Tag>
> {
	declare id: CreationOptional<string>;
	declare name: string;

	static associate(models: Record<string, ModelStatic<any>>) {
		Tag.hasMany(models.ProductTag, { foreignKey: 'tagId' });
	}
}

Tag.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: sequelize.literal('uuidv7()'),
		},
		name: { type: DataTypes.STRING, allowNull: false, unique: true },
	},
	{
		sequelize,
		tableName: 'tags',
		timestamps: true,
		underscored: true,
	},
);
