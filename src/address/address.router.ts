import { Router } from 'express';

import { addressController } from './address.controller';

export const addressRouter: Router = Router();

addressRouter.post('/', addressController.createAddress);
addressRouter.get('/', addressController.getAllAddresses);
addressRouter.get('/:addressId', addressController.getAddress);
addressRouter.patch('/:addressId', addressController.updateAddress);
addressRouter.delete('/:addressId', addressController.deleteAddress);
