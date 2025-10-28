import {
	CreationOptional,
	DataTypes,
	ForeignKey,
	InferAttributes,
	InferCreationAttributes,
	Model,
	ModelStatic,
} from 'sequelize';

import { sequelize } from '@/lib/config';

export class ProductTag extends Model<
	InferAttributes<ProductTag>,
	InferCreationAttributes<ProductTag>
> {
	declare id: CreationOptional<string>;
	declare productId: ForeignKey<string>;
	declare tagId: ForeignKey<string>;
	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;

	static associate(models: Record<string, ModelStatic<any>>) {
		ProductTag.belongsTo(models.Product, { foreignKey: 'productId' });
		ProductTag.belongsTo(models.Tag, { foreignKey: 'tagId' });
	}
}

ProductTag.init(
	{
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: sequelize.literal('uuidv7()'),
		},
		productId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: 'products', key: 'id' },
		},
		tagId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: { model: 'tags', key: 'id' },
		},
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize,
		tableName: 'product_tags',
		timestamps: true,
		underscored: true,
		indexes: [
			{ unique: true, fields: ['product_id', 'tag_id'] },
			{ fields: ['product_id'] },
			{ fields: ['tag_id'] },
		],
	},
);
