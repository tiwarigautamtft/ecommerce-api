import z from 'zod';

export const CreateProductDto = z.object({
	name: z.string().min(1).max(255),
	description: z.string().max(1000).optional(),
	price: z.number().min(0),
	quantity: z.number().int().min(0),
});

export type CreateProductDtoType = z.infer<typeof CreateProductDto>;
