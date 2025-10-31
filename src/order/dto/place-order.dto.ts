import z from 'zod';

import { CreateAddressDto } from '@/address/dto';

export const OrderItemDto = z.object({
	productId: z.uuidv7(),
	quantity: z.number().int().min(1).optional().default(1),
});

export type OrderItemDtoType = z.infer<typeof OrderItemDto>;

export const PlaceOrderDto = z.object({
	shippingAddress: z
		.union([
			z.string().min(1), // alias
			CreateAddressDto, // new address object
		])
		.optional(),
	items: z.array(OrderItemDto).optional(),
});

export type PlaceOrderDtoType = z.infer<typeof PlaceOrderDto>;
