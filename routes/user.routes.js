import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';

const router = Router();

router.post('/api/users', userController.register);
router.post('/login', userController.login);
router.get('/profile', userController.getProfile);
router.post('/logout', userController.logout);

export default router;
