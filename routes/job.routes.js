import { Router } from 'express';
import * as jobController from '../controllers/job.controller.js';

const router = Router();

router.get('/api/jobs', jobController.listJobs);
router.get('/api/jobs/:boardToken/:jobId', jobController.getJobDetail);

export default router;
