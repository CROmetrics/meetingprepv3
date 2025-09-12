import express from 'express';
import {
  getCalendarAuthUrl,
  handleCalendarCallback,
  getCalendarEvents,
  getCalendarEvent,
  generateMeetingBrief,
  testCalendarConfig
} from '../controllers/calendar.controller';

const router = express.Router();

/**
 * @route GET /api/calendar/auth-url
 * @desc Get Google Calendar OAuth authorization URL
 */
router.get('/auth-url', getCalendarAuthUrl);

/**
 * @route GET /api/calendar/callback
 * @desc Handle Google Calendar OAuth callback
 */
router.get('/callback', handleCalendarCallback);

/**
 * @route POST /api/calendar/events
 * @desc Get upcoming calendar events
 * @body { access_token, refresh_token?, lookback_days?, lookahead_days? }
 */
router.post('/events', getCalendarEvents);

/**
 * @route POST /api/calendar/events/:eventId
 * @desc Get specific calendar event by ID
 * @body { access_token, refresh_token? }
 */
router.post('/events/:eventId', getCalendarEvent);

/**
 * @route POST /api/calendar/meeting-brief
 * @desc Generate comprehensive meeting brief from calendar event
 * @body { access_token, refresh_token?, event_id, include_pdl_enrichment?, include_company_insights? }
 */
router.post('/meeting-brief', generateMeetingBrief);

/**
 * @route GET /api/calendar/test-config
 * @desc Test calendar service configuration
 */
router.get('/test-config', testCalendarConfig);

export default router;