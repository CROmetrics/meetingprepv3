import { Request, Response } from 'express';
import { z } from 'zod';
import customerResearchService from '../services/customer-research.service';
import hubspotService from '../services/hubspot.service';
import peopleDataLabsService from '../services/peopledatalabs.service';
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

const researchCompanySchema = z.object({
  domain: z.string().min(1).max(100),
  companyName: z.string().optional(),
});

const addCompanyToHubSpotSchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().optional(),
  industry: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  numberofemployees: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  founded_year: z.string().optional(),
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

  async researchCompany(req: Request, res: Response) {
    try {
      const { domain, companyName } = researchCompanySchema.parse(req.body);

      logger.info(`Starting company research for domain: ${domain}`);

      let hubspotResult = null;
      let pdlResult = null;
      let source = 'none';

      // First, try HubSpot
      if (hubspotService.isConfigured()) {
        try {
          const searchQuery = companyName || domain.split('.')[0];
          const hubspotCompanies = await hubspotService.searchCompanies(searchQuery);

          if (hubspotCompanies && hubspotCompanies.length > 0) {
            // Find the best match by domain or name
            const bestMatch = hubspotCompanies.find(company =>
              company.domain === domain ||
              company.name?.toLowerCase().includes(searchQuery.toLowerCase())
            ) || hubspotCompanies[0];

            hubspotResult = bestMatch;
            source = 'hubspot';
            logger.info(`Found company in HubSpot: ${bestMatch.name} (ID: ${bestMatch.id})`);
          }
        } catch (error) {
          logger.warn(`HubSpot company search failed for ${domain}:`, error);
        }
      }

      // If not found in HubSpot, try PDL
      if (!hubspotResult && peopleDataLabsService.isConfigured()) {
        try {
          pdlResult = await peopleDataLabsService.enrichCompanyByDomain(domain);
          if (pdlResult) {
            source = 'pdl';
            logger.info(`Found company in PDL: ${pdlResult.name}`);
          }
        } catch (error) {
          logger.warn(`PDL company search failed for ${domain}:`, error);
        }
      }

      // Return results
      return res.json({
        success: true,
        data: {
          hubspot: hubspotResult,
          pdl: pdlResult,
          source,
          domain,
          searchQuery: companyName || domain.split('.')[0]
        },
      });
    } catch (error) {
      logger.error('Error researching company:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid company research data',
          details: error.errors,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to research company',
      });
    }
  }

  async addCompanyToHubSpot(req: Request, res: Response) {
    try {
      const companyData = addCompanyToHubSpotSchema.parse(req.body);

      if (!hubspotService.isConfigured()) {
        return res.status(400).json({
          success: false,
          error: 'HubSpot is not configured. Please configure HUBSPOT_TOKEN.',
        });
      }

      logger.info(`Adding company to HubSpot: ${companyData.name}`);

      const createdCompany = await hubspotService.createCompany(companyData);

      if (!createdCompany) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create company in HubSpot',
        });
      }

      return res.json({
        success: true,
        data: createdCompany,
        message: `Company "${createdCompany.name}" successfully added to HubSpot`,
      });
    } catch (error) {
      logger.error('Error adding company to HubSpot:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid company data',
          details: error.errors,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Failed to add company to HubSpot',
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