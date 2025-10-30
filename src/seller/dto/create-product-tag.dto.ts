import z from 'zod';

export const CreateProductTagsDto = z.object({
	names: z.array(z.string().min(1).max(50)).min(1).max(10),
});

export type CreateProductTagsDtoType = z.infer<typeof CreateProductTagsDto>;
