import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import hubspotService from '../services/hubspot.service';
import openaiService from '../services/openai.service';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import config from '../config/env';
import { PROMPTS } from '../services/prompts';

export const getUsageLogs = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 100, offset = 0 } = req.query;

  try {
    const logPath = path.join(config.LOGS_DIR, 'usage.log');
    const logContent = await fs.readFile(logPath, 'utf-8');
    const lines = logContent.trim().split('\n').filter(Boolean);
    
    const logs = lines
      .slice(-Number(limit) - Number(offset))
      .slice(0, Number(limit))
      .map(line => {
        try {
          // Parse the log line (format: timestamp | JSON)
          const parts = line.split(' | ');
          if (parts.length >= 2) {
            return JSON.parse(parts[1]);
          }
          return null;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .reverse();

    res.json({
      success: true,
      data: {
        logs,
        total: lines.length,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      res.json({
        success: true,
        data: {
          logs: [],
          total: 0,
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } else {
      throw error;
    }
  }
});

export const getHubSpotContact = asyncHandler(async (req: Request, res: Response) => {
  const { contactId } = req.params;

  if (!contactId) {
    throw new AppError(400, 'Contact ID is required');
  }

  const contact = await hubspotService.getContact(contactId);

  if (!contact) {
    throw new AppError(404, 'Contact not found');
  }

  res.json({
    success: true,
    data: contact,
  });
});

export const testOpenAI = asyncHandler(async (req: Request, res: Response) => {
  const isConnected = await openaiService.testConnection();

  res.json({
    success: true,
    data: {
      connected: isConnected,
      model: config.OPENAI_MODEL,
      structuredOutput: config.STRUCTURED_OUTPUT,
      selfCritique: config.SELF_CRITIQUE,
    },
  });
});

export const previewPrompt = asyncHandler(async (req: Request, res: Response) => {
  const { type = 'internal', context = {} } = req.body;

  let systemPrompt: string;
  let userPrompt: string;

  if (type === 'internal') {
    systemPrompt = PROMPTS.INTERNAL_MEETING.SYSTEM;
    userPrompt = PROMPTS.INTERNAL_MEETING.USER;

    // Add context if provided
    if (context.attendees) {
      userPrompt += `\n\n**ATTENDEES:**\n${context.attendees.join(', ')}`;
    }
    if (context.purpose) {
      userPrompt += `\n\n**MEETING PURPOSE:**\n${context.purpose}`;
    }
    if (context.accountContext) {
      userPrompt += `\n\n**ACCOUNT CONTEXT:**\n${context.accountContext}`;
    }
    if (context.slackContext) {
      userPrompt += `\n\n**RECENT SLACK ACTIVITY:**\n${context.slackContext}`;
    }
  } else if (type === 'bd') {
    systemPrompt = PROMPTS.BD_MEETING.SYSTEM;
    userPrompt = PROMPTS.BD_MEETING.USER;

    if (context.researchContext) {
      userPrompt += `\n\n**RESEARCH CONTEXT:**\n${context.researchContext}`;
    }
  } else if (type === 'critique') {
    systemPrompt = PROMPTS.CRITIQUE.SYSTEM;
    userPrompt = PROMPTS.CRITIQUE.USER;

    if (context.originalReport) {
      userPrompt += `\n\n**ORIGINAL REPORT:**\n${context.originalReport}`;
    }
  } else {
    throw new AppError(400, 'Invalid prompt type. Must be: internal, bd, or critique');
  }

  res.json({
    success: true,
    data: {
      type,
      systemPrompt,
      userPrompt,
      totalLength: systemPrompt.length + userPrompt.length,
      estimatedTokens: Math.ceil((systemPrompt.length + userPrompt.length) / 4),
    },
  });
});

export const testCompanySearch = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    throw new AppError(400, 'Query parameter is required');
  }

  try {
    if (!hubspotService.isConfigured()) {
      return res.json({
        success: false,
        error: 'HubSpot is not configured',
        configured: false,
      });
    }

    const companies = await hubspotService.searchCompanies(query);
    
    return res.json({
      success: true,
      configured: true,
      query,
      found: companies.length,
      data: companies,
    });
  } catch (error) {
    return res.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      query,
    });
  }
});