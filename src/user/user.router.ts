import { Router } from 'express';

import { userController } from '.';

export const userRouter: Router = Router();

userRouter.get('/me', userController.getCurrentUser);
userRouter.delete('/me', userController.deleteCurrentUser);

userRouter.get('/me/cart', userController.getCart);
userRouter.post('/me/cart', userController.addToCart);
userRouter.put('/me/cart/:itemId', userController.updateCartItem);
userRouter.delete('/me/cart/:itemId', userController.removeFromCart);
userRouter.delete('/me/cart', userController.clearCart);

userRouter.get('/me/addresses', userController.getAllAddresses);
userRouter.get('/me/addresses/:addressId', userController.getAddress);
userRouter.post('/me/addresses', userController.createAddress);
userRouter.patch('/me/addresses/:addressId', userController.updateAddress);
userRouter.delete('/me/addresses/:addressId', userController.deleteAddress);

userRouter.post('/me/orders/checkout', userController.placeOrder);
userRouter.get('/me/orders', userController.getAllOrders);
userRouter.get('/me/orders/:orderId', userController.getOrder);
userRouter.patch('/me/orders/:orderId', userController.cancelOrder);

userRouter.post(
	'/me/orders/:orderId/payments',
	userController.makePaymentForOrder,
);
userRouter.get(
	'/me/orders/:orderId/payments',
	userController.getAllPaymentsForOrder,
);
userRouter.get(
	'/me/orders/:orderId/payments/:paymentId',
	userController.getAPaymentForOrder,
);
