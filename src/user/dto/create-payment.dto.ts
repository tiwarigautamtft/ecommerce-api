import z from 'zod';

export const CreatePaymentDto = z.object({
	amount: z.number().int().min(1),
});

export type CreatePaymentDtoType = z.infer<typeof CreatePaymentDto>;
