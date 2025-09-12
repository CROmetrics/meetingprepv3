import { Router } from 'express';
import * as bdController from '../controllers/bd.controller';
import * as debugController from '../controllers/debug.controller';
import calendarRoutes from './calendar.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Calendar routes
router.use('/calendar', calendarRoutes);

// BD routes
router.post('/bd/research-attendees', bdController.researchAttendees);
router.post('/bd/generate', bdController.generateBDReport);
router.post('/bd/add-to-hubspot', bdController.addToHubSpot);
router.get('/bd/search-deals', bdController.searchDeals);

// Debug routes
router.get('/usage-logs', debugController.getUsageLogs);
router.get('/debug/hubspot/:contactId', debugController.getHubSpotContact);
router.get('/debug/openai-test', debugController.testOpenAI);
router.post('/debug/prompt-preview', debugController.previewPrompt);

export default router;
