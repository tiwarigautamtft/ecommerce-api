import { z } from 'zod';

export const UpdateProductDto = z.object({
	name: z.string().min(1).max(255).optional(),
	description: z.string().max(1000).optional(),
	price: z.number().min(0).optional(),
	quantity: z.number().int().min(0).optional(),
});

export type UpdateProductDtoType = z.infer<typeof UpdateProductDto>;
