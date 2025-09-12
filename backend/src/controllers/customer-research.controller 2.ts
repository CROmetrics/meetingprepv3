import { Request, Response } from 'express';
import { z } from 'zod';
import customerResearchService from '../services/customer-research.service';
import hubspotService from '../services/hubspot.service';
import logger from '../utils/logger';

const searchCompaniesSchema = z.object({
  query: z.string().min(1).max(100),
});

const generateResearchSchema = z.object({
  companyId: z.string().min(1),
  prompt: z.string().min(10),
});

const updatePromptSchema = z.object({
  prompt: z.string().min(10),
});

export class CustomerResearchController {
  async searchCompanies(req: Request, res: Response) {
    try {
      const { query } = searchCompaniesSchema.parse(req.query);
      
      if (!hubspotService.isConfigured()) {
        return res.status(400).json({
          success: false,
          error: 'HubSpot is not configured. Please configure HUBSPOT_TOKEN.',
        });
      }

      const companies = await hubspotService.searchCompanies(query);
      
      return res.json({
        success: true,
        data: companies,
      });
    } catch (error) {
      logger.error('Error searching companies:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid search query',
          details: error.errors,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to search companies',
      });
    }
  }

  async getCompanyDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Company ID is required',
        });
      }

      if (!hubspotService.isConfigured()) {
        return res.status(400).json({
          success: false,
          error: 'HubSpot is not configured. Please configure HUBSPOT_TOKEN.',
        });
      }

      const company = await hubspotService.getCompany(id);
      
      if (!company) {
        return res.status(404).json({
          success: false,
          error: 'Company not found',
        });
      }

      return res.json({
        success: true,
        data: company,
      });
    } catch (error) {
      logger.error('Error getting company details:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get company details',
      });
    }
  }

  async getCompanyInsights(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Company ID is required',
        });
      }

      if (!hubspotService.isConfigured()) {
        return res.status(400).json({
          success: false,
          error: 'HubSpot is not configured. Please configure HUBSPOT_TOKEN.',
        });
      }

      // Get company details first
      const company = await hubspotService.getCompany(id);
      if (!company) {
        return res.status(404).json({
          success: false,
          error: 'Company not found',
        });
      }

      // Get comprehensive insights
      const insights = await hubspotService.getCompanyInsights(
        company.name || '',
        company.domain
      );

      return res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      logger.error('Error getting company insights:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get company insights',
      });
    }
  }

  async generateResearch(req: Request, res: Response) {
    try {
      const { companyId, prompt } = generateResearchSchema.parse(req.body);
      
      if (!hubspotService.isConfigured()) {
        return res.status(400).json({
          success: false,
          error: 'HubSpot is not configured. Please configure HUBSPOT_TOKEN.',
        });
      }

      const research = await customerResearchService.generateResearch(companyId, prompt);
      
      return res.json({
        success: true,
        data: research,
      });
    } catch (error) {
      logger.error('Error generating research:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to generate research',
      });
    }
  }

  async getResearchPrompt(req: Request, res: Response) {
    try {
      const prompt = await customerResearchService.getResearchPrompt();
      
      return res.json({
        success: true,
        data: { prompt },
      });
    } catch (error) {
      logger.error('Error getting research prompt:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get research prompt',
      });
    }
  }

  async updateResearchPrompt(req: Request, res: Response) {
    try {
      const { prompt } = updatePromptSchema.parse(req.body);
      
      await customerResearchService.updateResearchPrompt(prompt);
      
      return res.json({
        success: true,
        data: { prompt },
      });
    } catch (error) {
      logger.error('Error updating research prompt:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid prompt data',
          details: error.errors,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to update research prompt',
      });
    }
  }

  async resetResearchPrompt(req: Request, res: Response) {
    try {
      const defaultPrompt = await customerResearchService.resetResearchPrompt();
      
      return res.json({
        success: true,
        data: { prompt: defaultPrompt },
      });
    } catch (error) {
      logger.error('Error resetting research prompt:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to reset research prompt',
      });
    }
  }
}

export default new CustomerResearchController();