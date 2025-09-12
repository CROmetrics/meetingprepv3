import { Request, Response } from 'express';
import { z } from 'zod';
import researchService from '../services/research.service';
import hubspotService from '../services/hubspot.service';
import openaiService from '../services/openai.service';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { logUsage } from '../utils/logger';
import { BDMeetingRequest, ResearchResult, AttendeeResearch } from '../types/bd.types';

// Helper to convert empty strings to undefined
const emptyToUndefined = z
  .string()
  .transform((val) => (val === '' ? undefined : val))
  .optional();

const attendeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: emptyToUndefined.refine(
    (val) => !val || z.string().email().safeParse(val).success,
    'Invalid email format'
  ),
  title: emptyToUndefined,
  company: emptyToUndefined,
  linkedinUrl: emptyToUndefined.refine(
    (val) => !val || z.string().url().safeParse(val).success,
    'Invalid URL format'
  ),
});

const bdMeetingSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  attendees: z.array(attendeeSchema).min(1, 'At least one attendee is required'),
  purpose: z.string().optional(),
  additionalContext: z.string().optional(),
});

export const researchAttendees = asyncHandler(async (req: Request, res: Response) => {
  // Validate request
  const validationResult = bdMeetingSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new AppError(400, 'Invalid request data', 'VALIDATION_ERROR', validationResult.error as unknown as Record<string, unknown>);
  }

  const data = validationResult.data as BDMeetingRequest;

  // Log usage
  logUsage(
    'research_attendees',
    {
      company: data.company,
      attendeesCount: data.attendees.length,
    },
    req.ip
  );

  const attendeeResearch: AttendeeResearch[] = [];

  // Research each attendee
  for (const attendee of data.attendees) {
    const research: AttendeeResearch = {
      name: attendee.name,
      title: attendee.title,
      company: attendee.company || data.company,
      email: attendee.email,
      linkedinUrl: attendee.linkedinUrl,
    };

    // Look up in HubSpot
    if (hubspotService) {
      try {
        const hubspotContact = await hubspotService.findContact(attendee);
        if (hubspotContact) {
          research.hubspotData = hubspotContact;
          if (hubspotContact.linkedin_url && !research.linkedinUrl) {
            research.linkedinUrl = hubspotContact.linkedin_url;
          }
        }
      } catch (error) {
        console.error(`HubSpot lookup failed for ${attendee.name}:`, error);
      }
    }

    // Research LinkedIn if not already found
    if (!research.linkedinUrl) {
      const linkedinInfo = await researchService.researchAttendeeLinkedIn(
        attendee.name,
        attendee.company || data.company,
        attendee.title
      );
      research.linkedinUrl = linkedinInfo.url;
      research.linkedinSnippet = linkedinInfo.snippet;
    }

    // Background research
    const backgroundQuery = `${attendee.name} ${attendee.company || data.company} ${attendee.title || ''} background experience`;
    research.searchResults = await researchService.webSearch(backgroundQuery, 3);

    attendeeResearch.push(research);
  }

  res.json({
    success: true,
    data: {
      attendees: attendeeResearch,
      company: data.company,
    },
  });
});

export const generateBDReport = asyncHandler(async (req: Request, res: Response) => {
  // Validate request
  const validationResult = bdMeetingSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new AppError(400, 'Invalid request data', 'VALIDATION_ERROR', validationResult.error as unknown as Record<string, unknown>);
  }

  const data = validationResult.data as BDMeetingRequest;

  // Log usage
  logUsage(
    'generate_bd_report',
    {
      company: data.company,
      attendeesCount: data.attendees.length,
      hasPurpose: !!data.purpose,
    },
    req.ip
  );

  // Phase 1: Research attendees
  const attendeeResearch: AttendeeResearch[] = [];
  for (const attendee of data.attendees) {
    const research = await researchService.researchAttendeeBackground(
      attendee.name,
      attendee.company || data.company,
      attendee.title,
      attendee.linkedinUrl
    );

    // Enrich with HubSpot data if available
    if (hubspotService) {
      const hubspotContact = await hubspotService.findContact(attendee);
      if (hubspotContact) {
        research.hubspotData = hubspotContact;
      }
    }

    attendeeResearch.push(research);
  }

  // Phase 2: Company research
  const companyResearch = await researchService.researchCompany(data.company);

  // Phase 3: Competitive landscape
  const competitiveLandscape = await researchService.researchCompetitiveLandscape(data.company);

  // Compile research results
  const researchResult: ResearchResult = {
    attendeeResearch,
    companyResearch,
    competitiveLandscape,
    sources: [
      ...companyResearch.overview.map((r) => r.link),
      ...companyResearch.recentNews.map((r) => r.link),
      ...competitiveLandscape.results.map((r) => r.link),
    ].filter(Boolean),
  };

  // Format research context for AI
  let researchContext = `**TARGET COMPANY:** ${data.company}\n\n`;

  if (data.purpose) {
    researchContext += `**MEETING PURPOSE:** ${data.purpose}\n\n`;
  }

  researchContext += `**ATTENDEES:**\n`;
  for (const attendee of attendeeResearch) {
    researchContext += `- ${attendee.name}`;
    if (attendee.title) researchContext += ` (${attendee.title})`;
    if (attendee.company) researchContext += ` at ${attendee.company}`;
    if (attendee.linkedinUrl) researchContext += `\n  LinkedIn: ${attendee.linkedinUrl}`;
    if (attendee.linkedinSnippet) researchContext += `\n  ${attendee.linkedinSnippet}`;
    researchContext += '\n';
  }

  researchContext += `\n**COMPANY OVERVIEW:**\n`;
  for (const result of companyResearch.overview.slice(0, 3)) {
    researchContext += `- ${result.title}: ${result.snippet}\n`;
  }

  researchContext += `\n**RECENT NEWS:**\n`;
  for (const result of companyResearch.recentNews.slice(0, 3)) {
    researchContext += `- ${result.title}: ${result.snippet}\n`;
  }

  researchContext += `\n**COMPETITIVE LANDSCAPE:**\n`;
  for (const result of competitiveLandscape.results.slice(0, 3)) {
    researchContext += `- ${result.title}: ${result.snippet}\n`;
  }

  if (data.additionalContext) {
    researchContext += `\n**ADDITIONAL CONTEXT:**\n${data.additionalContext}\n`;
  }

  // Generate intelligence report
  const rawReport = await openaiService.generateBDIntelligenceReport(researchContext, true);
  
  // Convert string report to structured format expected by frontend
  const report = {
    executiveSummary: typeof rawReport === 'string' ? rawReport : (rawReport.executiveSummary || ''),
    targetCompanyIntelligence: typeof rawReport === 'string' ? '' : (rawReport.targetCompanyIntelligence || ''),
    meetingAttendeeAnalysis: typeof rawReport === 'string' ? '' : (rawReport.meetingAttendeeAnalysis || ''),
    strategicOpportunityAssessment: typeof rawReport === 'string' ? '' : (rawReport.strategicOpportunityAssessment || ''),
    meetingDynamicsStrategy: typeof rawReport === 'string' ? '' : (rawReport.meetingDynamicsStrategy || ''),
    keyQuestions: typeof rawReport === 'string' ? [] : (rawReport.keyQuestions || []),
    potentialObjectionsResponses: typeof rawReport === 'string' ? '' : (rawReport.potentialObjectionsResponses || ''),
    confidence: typeof rawReport === 'string' ? 85 : (rawReport.confidence || 85),
  };

  // If we got a string report, put the full content in executiveSummary for now
  if (typeof rawReport === 'string') {
    report.executiveSummary = rawReport;
  }

  res.json({
    success: true,
    data: {
      report,
      research: researchResult,
      metadata: {
        company: data.company,
        attendeesCount: data.attendees.length,
        sourcesCount: researchResult.sources.length,
        generatedAt: new Date().toISOString(),
      },
    },
  });
});

export const searchDeals = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    throw new AppError(400, 'Query parameter is required', 'VALIDATION_ERROR');
  }

  if (!hubspotService) {
    throw new AppError(400, 'HubSpot service not configured', 'SERVICE_UNAVAILABLE');
  }

  const results = await hubspotService.searchDeals(query);

  res.json({
    success: true,
    data: {
      results,
      count: results.length,
    },
  });
});

export const addToHubSpot = asyncHandler(async (req: Request, res: Response) => {
  const { attendees } = req.body;

  if (!Array.isArray(attendees) || attendees.length === 0) {
    throw new AppError(400, 'Attendees array is required');
  }

  // Log usage
  logUsage(
    'add_to_hubspot',
    {
      attendeesCount: attendees.length,
    },
    req.ip
  );

  const results = [];

  for (const attendee of attendees) {
    try {
      const validatedAttendee = attendeeSchema.parse(attendee);
      const contact = await hubspotService.createContact(validatedAttendee);

      results.push({
        success: true,
        attendee: validatedAttendee.name,
        hubspotId: contact?.id,
        message: contact ? 'Contact created/updated successfully' : 'Failed to create contact',
      });
    } catch (error) {
      results.push({
        success: false,
        attendee: attendee.name || 'Unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  res.json({
    success: true,
    data: {
      results,
      totalProcessed: attendees.length,
      successCount: results.filter((r) => r.success).length,
    },
  });
});
