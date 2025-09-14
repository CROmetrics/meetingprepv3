import { Request, Response } from 'express';
import { z } from 'zod';
import researchService from '../services/research.service';
import hubspotService from '../services/hubspot.service';
import openaiService from '../services/openai.service';
import reportsService from '../services/reports.service';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { logUsage } from '../utils/logger';
import logger from '../utils/logger';
import { BDMeetingRequest, ResearchResult, AttendeeResearch } from '../types/bd.types';
import { PROMPTS } from '../services/prompts';

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

// Helper function to validate and format AI reports
function validateAndFormatReport(rawReport: any, fullPromptUsed: string) {
  // Check if report is structured (object) vs legacy (string)
  const isStructuredReport = typeof rawReport === 'object' && rawReport !== null;

  if (isStructuredReport) {
    // Validate required fields
    const missingFields = [];
    const requiredFields = [
      'executiveSummary',
      'targetCompanyIntelligence',
      'meetingAttendeeAnalysis',
      'strategicOpportunityAssessment',
      'meetingDynamicsStrategy'
    ];

    for (const field of requiredFields) {
      if (!rawReport[field] || rawReport[field].toString().trim().length === 0) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      logger.warn(`AI report missing required fields: ${missingFields.join(', ')}`);
    }

    return {
      executiveSummary: rawReport.executiveSummary || 'Executive summary not provided by AI',
      targetCompanyIntelligence: rawReport.targetCompanyIntelligence || 'Target company analysis not provided by AI',
      meetingAttendeeAnalysis: rawReport.meetingAttendeeAnalysis || 'Attendee analysis not provided by AI',
      strategicOpportunityAssessment: rawReport.strategicOpportunityAssessment || 'Opportunity assessment not provided by AI',
      meetingDynamicsStrategy: rawReport.meetingDynamicsStrategy || 'Meeting strategy not provided by AI',
      keyQuestions: Array.isArray(rawReport.keyQuestions) ? rawReport.keyQuestions : ['Key questions not provided by AI'],
      potentialObjectionsResponses: rawReport.potentialObjectionsResponses || 'Objection handling not provided by AI',
      confidence: typeof rawReport.confidence === 'number' ? rawReport.confidence : 0.75,
      promptUsed: fullPromptUsed,
    };
  } else {
    // Legacy string format - put everything in executive summary
    logger.warn('AI returned legacy string format instead of structured JSON');
    return {
      executiveSummary: rawReport || 'Report generation failed',
      targetCompanyIntelligence: 'Report generated in legacy format. Please regenerate for detailed company analysis.',
      meetingAttendeeAnalysis: 'Report generated in legacy format. Please regenerate for detailed attendee analysis.',
      strategicOpportunityAssessment: 'Report generated in legacy format. Please regenerate for detailed opportunity assessment.',
      meetingDynamicsStrategy: 'Report generated in legacy format. Please regenerate for detailed meeting strategy.',
      keyQuestions: ['Report generated in legacy format. Please regenerate for specific questions.'],
      potentialObjectionsResponses: 'Report generated in legacy format. Please regenerate for objection handling.',
      confidence: 0.5,
      promptUsed: fullPromptUsed,
    };
  }
}

export const researchSingleAttendee = asyncHandler(async (req: Request, res: Response) => {
  // Validate request for single attendee
  const singleAttendeeSchema = z.object({
    company: z.string().min(1, 'Company name is required'),
    attendee: attendeeSchema,
  });

  const validationResult = singleAttendeeSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new AppError(400, 'Invalid request data', 'VALIDATION_ERROR', validationResult.error as unknown as Record<string, unknown>);
  }

  const { company, attendee } = validationResult.data;

  // Log usage
  logUsage(
    'research_single_attendee',
    {
      company,
      attendeeName: attendee.name,
    },
    req.ip
  );

  const research: AttendeeResearch = {
    name: attendee.name,
    title: attendee.title,
    company: attendee.company || company,
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
      attendee.company || company,
      attendee.title
    );
    research.linkedinUrl = linkedinInfo.url;
    research.linkedinSnippet = linkedinInfo.snippet;
  }

  // Background research
  const backgroundQuery = `${attendee.name} ${attendee.company || company} ${attendee.title || ''} background experience`;
  research.searchResults = await researchService.webSearch(backgroundQuery, 3);

  res.json({
    success: true,
    data: {
      attendee: research,
      company,
    },
  });
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
    researchContext += `\n=== ${attendee.name} ===\n`;
    if (attendee.title) researchContext += `Title: ${attendee.title}\n`;
    if (attendee.company) researchContext += `Company: ${attendee.company}\n`;
    if (attendee.email) researchContext += `Email: ${attendee.email}\n`;

    // HubSpot data
    if (attendee.hubspotData) {
      researchContext += `HubSpot Status: Contact found in CRM\n`;
      if (attendee.hubspotData.lifecyclestage) {
        researchContext += `Lifecycle Stage: ${attendee.hubspotData.lifecyclestage}\n`;
      }
    }

    // LinkedIn information
    if (attendee.linkedinUrl) {
      researchContext += `LinkedIn: ${attendee.linkedinUrl}\n`;
      if (attendee.linkedinSnippet) {
        researchContext += `LinkedIn Summary: ${attendee.linkedinSnippet}\n`;
      }
      if (attendee.linkedinProfileContent) {
        researchContext += `LinkedIn Profile Content:\n${attendee.linkedinProfileContent}\n`;
      }
    }

    // Background research
    if (attendee.searchResults && attendee.searchResults.length > 0) {
      researchContext += `Background Research:\n`;
      attendee.searchResults.forEach((result, idx) => {
        researchContext += `${idx + 1}. ${result.title}: ${result.snippet}\n`;
      });
    }

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
  let rawReport: any;

  try {
    rawReport = await openaiService.generateBDIntelligenceReport(researchContext, true);
  } catch (error) {
    logger.error('Failed to generate BD intelligence report:', error);
    throw new AppError(500, 'Failed to generate intelligence report', 'AI_GENERATION_ERROR');
  }

  // Build the complete prompt for visibility
  const fullPromptUsed = `SYSTEM PROMPT:\n${PROMPTS.BD_MEETING.SYSTEM}\n\nUSER PROMPT:\n${PROMPTS.BD_MEETING.USER}\n\nRESEARCH CONTEXT:\n${researchContext}`;

  // Validate and convert report
  const report = validateAndFormatReport(rawReport, fullPromptUsed);

  // Save report to file system for future reference
  const reportId = await reportsService.saveReport({
    company: data.company,
    purpose: data.purpose,
    report,
    research: researchResult,
    metadata: {
      company: data.company,
      attendeesCount: data.attendees.length,
      sourcesCount: researchResult.sources.length,
      generatedAt: new Date().toISOString(),
    },
    promptUsed: fullPromptUsed,
  });

  res.json({
    success: true,
    data: {
      reportId,
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

// Report management endpoints
export const listReports = asyncHandler(async (req: Request, res: Response) => {
  const { company } = req.query;
  
  let reports;
  if (company && typeof company === 'string') {
    reports = await reportsService.searchReports(company);
  } else {
    reports = await reportsService.listReports();
  }

  res.json({
    success: true,
    data: reports,
  });
});

export const getReport = asyncHandler(async (req: Request, res: Response) => {
  const { reportId } = req.params;

  if (!reportId) {
    throw new AppError(400, 'Report ID is required', 'VALIDATION_ERROR');
  }

  const report = await reportsService.getReport(reportId);

  if (!report) {
    throw new AppError(404, 'Report not found', 'NOT_FOUND');
  }

  res.json({
    success: true,
    data: report,
  });
});

export const deleteReport = asyncHandler(async (req: Request, res: Response) => {
  const { reportId } = req.params;

  if (!reportId) {
    throw new AppError(400, 'Report ID is required', 'VALIDATION_ERROR');
  }

  const deleted = await reportsService.deleteReport(reportId);

  if (!deleted) {
    throw new AppError(404, 'Report not found', 'NOT_FOUND');
  }

  res.json({
    success: true,
    message: 'Report deleted successfully',
  });
});
