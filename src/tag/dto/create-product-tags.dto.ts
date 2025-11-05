import z from 'zod';

export const CreateProductTagsDto = z.object({
	tags: z
		.array(
			z
				.string()
				.trim()
				.toLowerCase()
				.regex(
					/^[a-z0-9\s]+$/,
					'Tag names can only contain letters, numbers, and spaces',
				)
				.min(1, 'Tag name cannot be empty'),
		)
		.min(1)
		.max(25),
});

export type CreateProductTagsDtoType = z.infer<typeof CreateProductTagsDto>;
