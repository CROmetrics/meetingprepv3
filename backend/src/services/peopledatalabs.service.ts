import axios, { AxiosInstance } from 'axios';
import config from '../config/env';
import { CONSTANTS } from '../config/constants';
import logger from '../utils/logger';

export interface PDLPersonProfile {
  id?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  emails?: Array<{
    address: string;
    type?: string;
  }>;
  phone_numbers?: Array<{
    number: string;
    type?: string;
  }>;
  profiles?: Array<{
    network: string;
    id?: string;
    url?: string;
    username?: string;
  }>;
  job_history?: Array<{
    company?: {
      name?: string;
      size?: string;
      industry?: string;
      location?: {
        name?: string;
        locality?: string;
        region?: string;
        country?: string;
      };
    };
    title?: string;
    start_date?: string;
    end_date?: string;
    summary?: string;
  }>;
  education?: Array<{
    school?: {
      name?: string;
      type?: string;
      location?: {
        name?: string;
        locality?: string;
        region?: string;
        country?: string;
      };
    };
    degrees?: string[];
    majors?: string[];
    start_date?: string;
    end_date?: string;
  }>;
  skills?: string[];
  interests?: string[];
  industry?: string;
  job_title?: string;
  job_company_name?: string;
  job_last_updated?: string;
  linkedin_url?: string;
  linkedin_username?: string;
  location_names?: string[];
  summary?: string;
}

export interface PDLCompanyProfile {
  name?: string;
  display_name?: string;
  size?: string;
  employee_count?: number;
  id?: string;
  founded?: number;
  industry?: string;
  location?: {
    name?: string;
    locality?: string;
    region?: string;
    country?: string;
    continent?: string;
  };
  linkedin_url?: string;
  website?: string;
  ticker?: string;
  type?: string;
  summary?: string;
  tags?: string[];
  profiles?: Array<{
    network: string;
    id?: string;
    url?: string;
  }>;
}

export interface EnrichedContact {
  email: string;
  pdlProfile?: PDLPersonProfile;
  confidence?: number;
  enrichmentSource: 'peopledatalabs';
}

class PeopleDataLabsService {
  private client: AxiosInstance | null = null;
  private requestCount = 0;
  private lastRequestTime = 0;

  constructor() {
    if (config.PEOPLEDATALABS_API_KEY) {
      this.client = axios.create({
        baseURL: CONSTANTS.PEOPLEDATALABS_API_BASE,
        headers: {
          'X-Api-Key': config.PEOPLEDATALABS_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
      logger.info('People Data Labs service initialized');
    } else {
      logger.warn('People Data Labs API key not configured');
    }
  }

  private ensureClient(): AxiosInstance {
    if (!this.client) {
      throw new Error('People Data Labs client not initialized. Please configure PEOPLEDATALABS_API_KEY.');
    }
    return this.client;
  }

  /**
   * Rate limiting check
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Reset counter if more than a minute has passed
    if (timeSinceLastRequest > 60000) {
      this.requestCount = 0;
    }
    
    if (this.requestCount >= CONSTANTS.PEOPLEDATALABS.MAX_REQUESTS_PER_MINUTE) {
      const waitTime = 60000 - timeSinceLastRequest;
      logger.warn(`PDL rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
    }
    
    this.requestCount++;
    this.lastRequestTime = now;
  }

  /**
   * Enrich a single contact by email
   */
  async enrichContactByEmail(email: string): Promise<EnrichedContact> {
    const client = this.ensureClient();
    await this.checkRateLimit();
    
    try {
      const response = await client.post('/person/enrich', {
        email: email,
        required: 'emails',
        data_include: CONSTANTS.PEOPLEDATALABS.ENRICHMENT_FIELDS.join(','),
        pretty: true
      });

      if (response.data.status === 200 && response.data.data) {
        logger.info(`Successfully enriched contact: ${email}`);
        return {
          email,
          pdlProfile: response.data.data,
          confidence: response.data.confidence,
          enrichmentSource: 'peopledatalabs'
        };
      } else {
        logger.warn(`No PDL data found for email: ${email}`);
        return {
          email,
          enrichmentSource: 'peopledatalabs'
        };
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          logger.info(`PDL: No profile found for ${email}`);
        } else if (error.response?.status === 402) {
          logger.error('PDL: API quota exceeded');
          throw new Error('People Data Labs API quota exceeded');
        } else {
          logger.error(`PDL API error for ${email}:`, error.response?.data);
        }
      } else {
        logger.error(`PDL enrichment error for ${email}:`, error);
      }
      
      return {
        email,
        enrichmentSource: 'peopledatalabs'
      };
    }
  }

  /**
   * Enrich multiple contacts by email
   */
  async enrichContactsByEmail(emails: string[]): Promise<EnrichedContact[]> {
    const results: EnrichedContact[] = [];
    const uniqueEmails = [...new Set(emails.map(e => e.trim().toLowerCase()).filter(Boolean))];

    logger.info(`Enriching ${uniqueEmails.length} contacts with PDL`);

    for (const email of uniqueEmails) {
      try {
        const enrichedContact = await this.enrichContactByEmail(email);
        results.push(enrichedContact);
        
        // Small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`Failed to enrich ${email}:`, error);
        results.push({
          email,
          enrichmentSource: 'peopledatalabs'
        });
      }
    }

    return results;
  }

  /**
   * Search for company information by domain
   */
  async enrichCompanyByDomain(domain: string): Promise<PDLCompanyProfile | null> {
    const client = this.ensureClient();
    await this.checkRateLimit();
    
    try {
      const response = await client.post('/company/enrich', {
        website: domain,
        pretty: true
      });

      if (response.data.status === 200 && response.data.data) {
        logger.info(`Successfully enriched company: ${domain}`);
        return response.data.data;
      } else {
        logger.warn(`No PDL company data found for: ${domain}`);
        return null;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          logger.info(`PDL: No company found for ${domain}`);
        } else {
          logger.error(`PDL company API error for ${domain}:`, error.response?.data);
        }
      } else {
        logger.error(`PDL company enrichment error for ${domain}:`, error);
      }
      
      return null;
    }
  }

  /**
   * Extract LinkedIn URL from enriched profile
   */
  extractLinkedInUrl(profile: PDLPersonProfile): string | null {
    // Check the linkedin_url field first
    if (profile.linkedin_url) {
      return profile.linkedin_url;
    }

    // Check profiles array for LinkedIn
    const linkedinProfile = profile.profiles?.find(p => 
      p.network.toLowerCase() === 'linkedin' && p.url
    );

    return linkedinProfile?.url || null;
  }

  /**
   * Extract current job information
   */
  extractCurrentJob(profile: PDLPersonProfile): {
    title?: string;
    company?: string;
    companySize?: string;
    industry?: string;
  } | null {
    // Check job_title and job_company_name first (most recent)
    if (profile.job_title || profile.job_company_name) {
      return {
        title: profile.job_title,
        company: profile.job_company_name,
        industry: profile.industry
      };
    }

    // Fall back to most recent job in history
    if (profile.job_history && profile.job_history.length > 0) {
      const mostRecentJob = profile.job_history.find(job => !job.end_date) || profile.job_history[0];
      
      return {
        title: mostRecentJob.title,
        company: mostRecentJob.company?.name,
        companySize: mostRecentJob.company?.size,
        industry: mostRecentJob.company?.industry || profile.industry
      };
    }

    return null;
  }

  /**
   * Extract education summary
   */
  extractEducationSummary(profile: PDLPersonProfile): string[] {
    if (!profile.education) return [];

    return profile.education
      .map(edu => {
        const school = edu.school?.name || '';
        const degrees = edu.degrees?.join(', ') || '';
        const majors = edu.majors?.join(', ') || '';
        
        let summary = school;
        if (degrees) summary += ` - ${degrees}`;
        if (majors) summary += ` in ${majors}`;
        
        return summary;
      })
      .filter(Boolean);
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Get API usage stats
   */
  getUsageStats(): { requestCount: number; lastRequestTime: number } {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime
    };
  }
}

export default new PeopleDataLabsService();