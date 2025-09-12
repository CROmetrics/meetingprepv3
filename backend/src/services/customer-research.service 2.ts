import fs from 'fs/promises';
import path from 'path';
import hubspotService, { CompanyInsight } from './hubspot.service';
import openaiService from './openai.service';
import logger from '../utils/logger';

const PROMPTS_FILE = path.join(__dirname, '../../data/research-prompts.json');

const DEFAULT_RESEARCH_PROMPT = `You are a business intelligence analyst researching a prospective customer for CroMetrics, a leading conversion rate optimization (CRO) and digital analytics consultancy.

Your goal is to create a comprehensive research report that helps our sales and account teams understand:
1. The company's business model and digital presence
2. Potential optimization opportunities
3. Decision-making structure and key contacts
4. Competitive landscape and market position
5. Budget and timing considerations

Based on the HubSpot data provided, create a detailed research report with the following sections:

## Company Overview
- Business model and core revenue streams
- Industry position and recent developments
- Digital presence and technology stack assessment

## Optimization Opportunities
- Potential CRO opportunities based on their business model
- Revenue impact potential (estimate based on industry standards)
- Priority areas for testing and optimization

## Key Contacts & Decision Makers
- Leadership structure and key decision makers
- Relevant contacts for CRO initiatives
- Reporting relationships and influence mapping

## Market Context
- Industry trends affecting their optimization needs
- Competitive pressures and market dynamics
- Seasonal patterns or business cycles to consider

## Engagement Strategy
- Recommended approach and messaging
- Value proposition alignment
- Potential objections and responses
- Budget and timeline considerations

## Next Steps
- Specific actions to advance the opportunity
- Information gaps to fill
- Stakeholders to engage

Use the provided HubSpot data as your primary source. If key information is missing, indicate what additional research would be valuable. Focus on actionable insights that will help CroMetrics win this potential client.`;

export interface ResearchPrompts {
  customerResearch: string;
  lastUpdated: string;
}

export interface ResearchReport {
  companyId: string;
  companyName: string;
  report: string;
  hubspotData: CompanyInsight;
  generatedAt: string;
  promptUsed: string;
}

class CustomerResearchService {
  private promptsCache: ResearchPrompts | null = null;

  private async ensurePromptsFile(): Promise<void> {
    const dataDir = path.dirname(PROMPTS_FILE);
    
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    try {
      await fs.access(PROMPTS_FILE);
    } catch {
      // Create default prompts file
      const defaultPrompts: ResearchPrompts = {
        customerResearch: DEFAULT_RESEARCH_PROMPT,
        lastUpdated: new Date().toISOString(),
      };
      await fs.writeFile(PROMPTS_FILE, JSON.stringify(defaultPrompts, null, 2));
      logger.info('Created default research prompts file');
    }
  }

  private async loadPrompts(): Promise<ResearchPrompts> {
    if (this.promptsCache) {
      return this.promptsCache;
    }

    await this.ensurePromptsFile();
    
    try {
      const data = await fs.readFile(PROMPTS_FILE, 'utf-8');
      this.promptsCache = JSON.parse(data);
      return this.promptsCache!;
    } catch (error) {
      logger.error('Error loading prompts file:', error);
      // Return default if file is corrupted
      return {
        customerResearch: DEFAULT_RESEARCH_PROMPT,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  private async savePrompts(prompts: ResearchPrompts): Promise<void> {
    try {
      await fs.writeFile(PROMPTS_FILE, JSON.stringify(prompts, null, 2));
      this.promptsCache = prompts;
      logger.info('Research prompts saved successfully');
    } catch (error) {
      logger.error('Error saving prompts file:', error);
      throw new Error('Failed to save research prompts');
    }
  }

  async getResearchPrompt(): Promise<string> {
    const prompts = await this.loadPrompts();
    return prompts.customerResearch;
  }

  async updateResearchPrompt(newPrompt: string): Promise<void> {
    const prompts = await this.loadPrompts();
    prompts.customerResearch = newPrompt;
    prompts.lastUpdated = new Date().toISOString();
    await this.savePrompts(prompts);
  }

  async resetResearchPrompt(): Promise<string> {
    const prompts: ResearchPrompts = {
      customerResearch: DEFAULT_RESEARCH_PROMPT,
      lastUpdated: new Date().toISOString(),
    };
    await this.savePrompts(prompts);
    return DEFAULT_RESEARCH_PROMPT;
  }

  async generateResearch(companyId: string, customPrompt?: string): Promise<ResearchReport> {
    try {
      // Get company insights from HubSpot
      const company = await hubspotService.getCompany(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      const insights = await hubspotService.getCompanyInsights(
        company.name || '',
        company.domain
      );

      if (!insights) {
        throw new Error('Failed to get company insights');
      }

      // Use custom prompt or default
      const prompt = customPrompt || await this.getResearchPrompt();

      // Format HubSpot data for AI
      const hubspotContext = this.formatHubSpotContext(insights);

      // Generate research report using OpenAI
      const fullPrompt = `${prompt}\n\n## HubSpot Data\n\n${hubspotContext}`;
      const report = await openaiService.generateResponse(fullPrompt);

      const researchReport: ResearchReport = {
        companyId,
        companyName: company.name || 'Unknown Company',
        report,
        hubspotData: insights,
        generatedAt: new Date().toISOString(),
        promptUsed: prompt,
      };

      logger.info(`Generated research report for company: ${company.name}`);
      return researchReport;
    } catch (error) {
      logger.error('Error generating research report:', error);
      throw new Error('Failed to generate research report');
    }
  }

  private formatHubSpotContext(insights: CompanyInsight): string {
    const { company, relatedContacts, keyStakeholders, recentDeals } = insights;
    
    let context = `### Company Information\n`;
    context += `- **Name:** ${company.name || 'N/A'}\n`;
    context += `- **Domain:** ${company.domain || 'N/A'}\n`;
    context += `- **Industry:** ${company.industry || 'N/A'}\n`;
    context += `- **Location:** ${[company.city, company.state, company.country].filter(Boolean).join(', ') || 'N/A'}\n`;
    context += `- **Employees:** ${company.numberofemployees || 'N/A'}\n`;
    context += `- **Annual Revenue:** ${company.annualrevenue || 'N/A'}\n`;
    context += `- **Founded:** ${company.founded_year || 'N/A'}\n`;
    context += `- **Website:** ${company.website || 'N/A'}\n`;
    context += `- **LinkedIn:** ${company.linkedincompanypage || 'N/A'}\n`;
    context += `- **Description:** ${company.description || 'N/A'}\n\n`;

    if (keyStakeholders.length > 0) {
      context += `### Key Stakeholders (${keyStakeholders.length})\n`;
      keyStakeholders.forEach(contact => {
        context += `- **${contact.firstname || ''} ${contact.lastname || ''}**\n`;
        context += `  - Title: ${contact.jobtitle || 'N/A'}\n`;
        context += `  - Email: ${contact.email || 'N/A'}\n`;
        if (contact.linkedin_url) {
          context += `  - LinkedIn: ${contact.linkedin_url}\n`;
        }
        context += `\n`;
      });
    }

    if (relatedContacts.length > 0) {
      context += `### Additional Contacts (${relatedContacts.length} total)\n`;
      const nonStakeholderContacts = relatedContacts
        .filter(contact => !keyStakeholders.some(stakeholder => stakeholder.id === contact.id))
        .slice(0, 10); // Show first 10 non-stakeholder contacts
      
      nonStakeholderContacts.forEach(contact => {
        context += `- ${contact.firstname || ''} ${contact.lastname || ''} (${contact.jobtitle || 'N/A'})\n`;
      });
      context += `\n`;
    }

    if (recentDeals.length > 0) {
      context += `### Recent Deals (${recentDeals.length})\n`;
      recentDeals.forEach(deal => {
        context += `- **${deal.properties?.dealname || 'Unnamed Deal'}**\n`;
        context += `  - Amount: ${deal.properties?.amount || 'N/A'}\n`;
        context += `  - Stage: ${deal.properties?.dealstage || 'N/A'}\n`;
        context += `  - Close Date: ${deal.properties?.closedate || 'N/A'}\n`;
        context += `\n`;
      });
    }

    context += `### Summary Statistics\n`;
    context += `- Total Contacts: ${insights.totalContacts}\n`;
    context += `- Key Stakeholders: ${keyStakeholders.length}\n`;
    context += `- Recent Deals: ${recentDeals.length}\n`;

    return context;
  }

  async getPromptLastUpdated(): Promise<string> {
    const prompts = await this.loadPrompts();
    return prompts.lastUpdated;
  }
}

export default new CustomerResearchService();