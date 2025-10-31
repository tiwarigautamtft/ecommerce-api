import z from 'zod';

export const CreateAddressDto = z.object({
	alias: z.string().min(1).max(30),
	name: z.string().min(1),
	addressLineOne: z.string().min(1),
	addressLineTwo: z.string().optional().nullable(),
	city: z.string().min(1),
	state: z.string().min(1),
	pincode: z.coerce
		.string()
		.length(6, 'Should be exactly 6 digits')
		.regex(/^\d+$/, 'Only numbers are allowed'),
	phone: z.string().min(10).max(15),
	isDefault: z.boolean().optional().default(false),
});

export type CreateAddressDtoType = z.infer<typeof CreateAddressDto>;
