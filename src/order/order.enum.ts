export enum OrderItemStatus {
	PENDING = 'pending',
	SHIPPED = 'shipped',
	OUT_FOR_DELIVERY = 'out_for_delivery',
	DELIVERED = 'delivered',
	CANCELLED = 'cancelled',
}

export enum CancellationBy {
	NONE = 'none',
	BUYER = 'buyer',
	SELLER = 'seller',
	SYSTEM = 'system',
}
