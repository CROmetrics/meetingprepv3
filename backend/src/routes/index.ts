import { Router } from 'express';
import * as bdController from '../controllers/bd.controller';
import * as debugController from '../controllers/debug.controller';
import customerResearchController from '../controllers/customer-research.controller';
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

// Customer Research routes
router.get('/research/companies/search', customerResearchController.searchCompanies);
router.get('/research/companies/:id', customerResearchController.getCompanyDetails);
router.get('/research/companies/:id/insights', customerResearchController.getCompanyInsights);
router.post('/research/generate', customerResearchController.generateResearch);
router.get('/research/prompts', customerResearchController.getResearchPrompt);
router.put('/research/prompts', customerResearchController.updateResearchPrompt);
router.post('/research/prompts/reset', customerResearchController.resetResearchPrompt);

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
