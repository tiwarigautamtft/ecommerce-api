import { Router } from 'express';

import { tagController } from './tag.controller';

export const tagRouter = Router({ mergeParams: true });

tagRouter.post('/', tagController.createProductTags);
tagRouter.post('/generate', tagController.generateProductTags);

tagRouter.get('/', tagController.getAllProductTags);
tagRouter.get('/:tagId', tagController.getProductTag);

tagRouter.delete('/:tagId', tagController.removeProductTag);
tagRouter.delete('/', tagController.removeAllProductTags);
