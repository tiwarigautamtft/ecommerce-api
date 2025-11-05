import z from 'zod';

export const SearchProductsDto = z.object({
	query: z.string().min(0).max(255).optional(),
	sortBy: z
		.enum(['price', 'name', 'createdAt'])
		.optional()
		.default('createdAt'),
	sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
	minPrice: z.coerce.number().min(0).optional(),
	maxPrice: z.coerce.number().min(0).optional(),
	page: z.coerce.number().int().min(1).optional().default(1),
	limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type SearchProductsDtoType = z.infer<typeof SearchProductsDto>;
