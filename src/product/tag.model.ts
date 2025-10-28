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
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	static associate(models: Record<string, ModelStatic<any>>) {
		Tag.belongsToMany(models.Product, {
			through: models.ProductTag,
			as: 'productTags',
		});
	}
}

Tag.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: sequelize.literal('uuidv7()'),
		},
		name: { type: DataTypes.STRING, allowNull: false },
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: 'tags',
		timestamps: true,
		underscored: true,
		indexes: [{ unique: true, fields: ['name'] }],
	},
);
