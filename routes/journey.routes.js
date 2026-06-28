import { Router } from 'express';
import * as journeyController from '../controllers/journey.controller.js';

const router = Router();

router.get('/api/journey-roles', journeyController.listJourneyRolesCatalog);
router.get(
    '/api/journey-discovery/questions',
    journeyController.listJourneyDiscoveryQuestions,
);
router.post(
    '/api/journey-discovery/recommend',
    journeyController.recommendJourneyRolesFromAnswers,
);
router.get('/api/journeys', journeyController.listJourneys);
router.post('/api/journeys', journeyController.createJourney);
router.get('/api/journeys/:id/skill-insights', journeyController.getJourneySkillInsights);
router.get('/api/journeys/:id', journeyController.getJourney);
router.patch('/api/journeys/:id', journeyController.updateJourney);
router.delete('/api/journeys/:id', journeyController.deleteJourney);

export default router;
