import z from 'zod';

export const CreateSellerProfileDto = z.object({
	storeName: z.string().min(2, 'Store name is required'),
});

export type CreateSellerProfileDtoType = z.infer<typeof CreateSellerProfileDto>;
