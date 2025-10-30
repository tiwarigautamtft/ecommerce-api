import z from 'zod';

export const CreateProductDto = z.object({
	name: z.string().min(1).max(255),
	description: z.string().max(1000).optional().nullable(),
	price: z.number().int().min(0),
	quantity: z.number().int().min(0),
	isPublished: z.boolean().optional().default(true),
});

export type CreateProductDtoType = z.infer<typeof CreateProductDto>;
