import { Router } from 'express';
import * as channelsController from '../controllers/channels.controller';
import * as meetingController from '../controllers/meeting.controller';
import * as bdController from '../controllers/bd.controller';
import * as debugController from '../controllers/debug.controller';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Channel routes
router.get('/channels', channelsController.listChannels);
router.get('/channels/:channelId/messages', channelsController.getChannelMessages);

// Meeting routes
router.post('/run', meetingController.generateMeetingBrief);

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