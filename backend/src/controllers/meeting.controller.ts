import { Request, Response } from 'express';
import { z } from 'zod';
import slackService from '../services/slack.service';
import hubspotService from '../services/hubspot.service';
import openaiService from '../services/openai.service';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { logUsage } from '../utils/logger';
import { MeetingBriefRequest } from '../types/meeting.types';

const meetingBriefSchema = z.object({
  channelId: z.string().min(1, 'Channel ID is required'),
  lookbackDays: z.number().min(1).max(90).default(14),
  maxMessages: z.number().min(10).max(1000).default(300),
  attendees: z.array(z.string()).default([]),
  purpose: z.string().optional(),
  accountContext: z.string().optional(),
});

export const generateMeetingBrief = asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validationResult = meetingBriefSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new AppError(400, 'Invalid request data', 'VALIDATION_ERROR', validationResult.error);
  }

  const data = validationResult.data as MeetingBriefRequest;

  // Log usage
  logUsage('generate_meeting_brief', {
    channelId: data.channelId,
    lookbackDays: data.lookbackDays,
    attendeesCount: data.attendees?.length || 0,
    hasPurpose: !!data.purpose,
    hasAccountContext: !!data.accountContext,
  }, req.ip);

  // Fetch Slack context
  const slackContext = await slackService.fetchChannelContext(data.channelId, {
    lookbackDays: data.lookbackDays,
    maxMessages: data.maxMessages,
    resolveNames: true,
    expandThreads: true,
  });

  const formattedContext = slackService.formatContextAsText(slackContext);

  // Enrich attendees with HubSpot data if available
  let enrichedAttendees = data.attendees || [];
  if (enrichedAttendees.length > 0 && hubspotService) {
    try {
      // Try to find attendees in HubSpot
      for (let i = 0; i < enrichedAttendees.length; i++) {
        const attendee = enrichedAttendees[i];
        // Parse attendee string (could be "Name <email>" format)
        const emailMatch = attendee.match(/<(.+)>/);
        const email = emailMatch ? emailMatch[1] : undefined;
        const name = email ? attendee.replace(`<${email}>`, '').trim() : attendee;

        if (email) {
          const contacts = await hubspotService.fetchContactsByEmail([email]);
          if (contacts.length > 0) {
            const contact = contacts[0];
            enrichedAttendees[i] = `${name} (${contact.jobtitle || 'Unknown Role'} at ${contact.company || 'Unknown Company'})`;
            if (contact.linkedin_url) {
              enrichedAttendees[i] += ` - LinkedIn: ${contact.linkedin_url}`;
            }
          }
        }
      }
    } catch (error) {
      // Log error but continue without enrichment
      console.error('Failed to enrich attendees with HubSpot data:', error);
    }
  }

  // Generate meeting brief
  const brief = await openaiService.generateInternalMeetingBrief(
    formattedContext,
    enrichedAttendees,
    data.purpose,
    data.accountContext
  );

  res.json({
    success: true,
    data: {
      brief,
      metadata: {
        channelId: data.channelId,
        messageCount: slackContext.totalMessages,
        lookbackDays: data.lookbackDays,
        generatedAt: new Date().toISOString(),
      },
    },
  });
});