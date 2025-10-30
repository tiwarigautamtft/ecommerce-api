import z from 'zod';

export const UpdateAddressDto = z.object({
	alias: z.string().min(1).max(30).optional(),
	name: z.string().min(1).optional(),
	addressLineOne: z.string().min(1).optional(),
	addressLineTwo: z.string().optional().nullable(),
	city: z.string().min(1).optional(),
	state: z.string().min(1).optional(),
	pincode: z.string().length(6).regex(/^\d+$/).optional(),
	phone: z.string().min(10).max(15).optional(),
	isDefault: z.boolean().optional(),
});

export type UpdateAddressDtoType = z.infer<typeof UpdateAddressDto>;
