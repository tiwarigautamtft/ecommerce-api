import z from 'zod';

export const UpdateCartDto = z.object({
	quantity: z.coerce.number().min(1).optional().default(1),
});

export type UpdateCartDtoType = z.infer<typeof UpdateCartDto>;
