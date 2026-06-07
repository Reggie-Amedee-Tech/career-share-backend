import { Router } from 'express';
import * as resourceController from '../controllers/resource.controller.js';

const router = Router();

router.post('/resources', resourceController.createResource);
router.get('/resources', resourceController.listResources);
router.get('/resources/:id', resourceController.getResource);
router.patch('/resources/:id', resourceController.updateResource);
router.delete('/resources/:id', resourceController.deleteResource);

export default router;
