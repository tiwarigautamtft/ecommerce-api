import z from 'zod';

export const CreateBuyerProfileSchema = z.object({
	addressLineOne: z.string().min(1).max(100),
	addressLineTwo: z.string().min(1).max(100).optional(),
	city: z.string().min(1).max(50),
	pincode: z.number().min(100000).max(999999),
	state: z.string().min(1).max(50),
	phone: z.string().min(10).max(15),
});

export type CreateBuyerProfileDto = z.infer<typeof CreateBuyerProfileSchema>;
