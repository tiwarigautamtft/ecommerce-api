export enum OrderStatus {
	PENDING = 'pending',
	PAID = 'paid',
	PAYMENT_FAILED = 'payment_failed',
	CANCELLED = 'cancelled',
	REFUND_PENDING = 'refund_pending',
	REFUNDED = 'refunded',
}

export enum OrderItemStatus {
	PENDING = 'pending',
	SHIPPED = 'shipped',
	OUT_FOR_DELIVERY = 'out_for_delivery',
	DELIVERED = 'delivered',
	CANCELLED = 'cancelled',
}

export enum CancellationBy {
	BUYER = 'buyer',
	SELLER = 'seller',
	NONE = 'none',
}