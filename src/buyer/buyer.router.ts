import { Router } from 'express';

import { buyerController } from '.';

export const buyerRouter: Router = Router();

buyerRouter.get('/profile', buyerController.getCurrentBuyerProfile);
buyerRouter.delete('/profile', buyerController.deleteCurrentBuyerProfile);

buyerRouter.get('/products', buyerController.searchOwnProducts);
buyerRouter.get('/products/:productId', buyerController.getProductById);

buyerRouter.get('/cart', buyerController.getCart);
buyerRouter.post('/cart', buyerController.addToCart);
buyerRouter.put('/cart/:itemId', buyerController.updateCartItem);
buyerRouter.delete('/cart/:itemId', buyerController.removeFromCart);
buyerRouter.delete('/cart', buyerController.clearCart);

// buyerRouter.post('/orders', buyerController.createOrder);
// buyerRouter.get('/orders', buyerController.getBuyerOrders);
// buyerRouter.get('/orders/:orderId', buyerController.getOrderById);
//
// buyerRouter.get('/invoices', buyerController.getBuyerInvoices);
// buyerRouter.get('/invoices/:invoiceId', buyerController.getInvoiceById);
//
// buyerRouter.post('/payments', buyerController.processPayment);
// buyerRouter.get('/payments', buyerController.getBuyerPayments);
