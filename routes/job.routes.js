import { Router } from 'express';
import * as jobController from '../controllers/job.controller.js';

const router = Router();

router.get('/api/jobs', jobController.listJobs);

export default router;
