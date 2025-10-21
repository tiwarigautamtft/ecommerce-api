import z from 'zod';

export const AddToCartDto = z.object({
	productId: z.uuid(),
	quantity: z.coerce.number().min(1).optional().default(1),
});

export type AddToCartDtoType = z.infer<typeof AddToCartDto>;
