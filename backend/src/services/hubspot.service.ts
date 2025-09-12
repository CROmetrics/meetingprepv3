import axios, { AxiosInstance } from 'axios';
import config from '../config/env';
import { CONSTANTS } from '../config/constants';
import logger from '../utils/logger';
import { HubSpotContact, Attendee } from '../types/bd.types';

export interface HubSpotCompany {
  id: string;
  name?: string;
  domain?: string;
  industry?: string;
  city?: string;
  state?: string;
  country?: string;
  numberofemployees?: string;
  annualrevenue?: string;
  linkedincompanypage?: string;
  description?: string;
  website?: string;
  founded_year?: string;
  type?: string;
}

export interface CompanyInsight {
  company: HubSpotCompany;
  relatedContacts: HubSpotContact[];
  totalContacts: number;
  recentDeals: any[];
  keyStakeholders: HubSpotContact[];
}

class HubSpotService {
  private client: AxiosInstance | null = null;

  constructor() {
    if (config.HUBSPOT_TOKEN) {
      this.client = axios.create({
        baseURL: CONSTANTS.HUBSPOT_API_BASE,
        headers: {
          'Authorization': `Bearer ${config.HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
      logger.info('HubSpot service initialized');
    } else {
      logger.warn('HubSpot token not configured');
    }
  }

  private ensureClient(): AxiosInstance {
    if (!this.client) {
      throw new Error('HubSpot client not initialized. Please configure HUBSPOT_TOKEN.');
    }
    return this.client;
  }

  async fetchContactsByEmail(emails: string[]): Promise<HubSpotContact[]> {
    const client = this.ensureClient();
    const results: HubSpotContact[] = [];
    const uniqueEmails = [...new Set(emails.map(e => e.trim().toLowerCase()).filter(Boolean))];

    for (const email of uniqueEmails) {
      try {
        const payload = {
          filterGroups: [{
            filters: [{
              propertyName: 'email',
              operator: 'EQ',
              value: email,
            }],
          }],
          properties: CONSTANTS.HUBSPOT.CONTACT_PROPERTIES,
          limit: 1,
        };

        const response = await client.post('/crm/v3/objects/contacts/search', payload);
        
        if (response.data.results && response.data.results.length > 0) {
          const contact = response.data.results[0];
          results.push({
            ...contact.properties,
            id: contact.id,
          });
        }
      } catch (error) {
        logger.error(`Error fetching HubSpot contact for ${email}:`, error);
      }
    }

    logger.info(`Fetched ${results.length} HubSpot contacts for ${uniqueEmails.length} emails`);
    return results;
  }

  async searchContactByName(name: string, company?: string): Promise<HubSpotContact | null> {
    const client = this.ensureClient();

    if (!name) return null;

    try {
      const nameParts = name.trim().split(/\s+/);
      if (nameParts.length < 2) return null;

      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      // Try multiple search strategies
      const strategies = [
        // Strategy 1: Exact match with company
        company ? {
          filters: [
            { propertyName: 'firstname', operator: 'EQ', value: firstName },
            { propertyName: 'lastname', operator: 'EQ', value: lastName },
            { propertyName: 'company', operator: 'EQ', value: company },
          ],
        } : null,
        // Strategy 2: Name match without company
        {
          filters: [
            { propertyName: 'firstname', operator: 'EQ', value: firstName },
            { propertyName: 'lastname', operator: 'EQ', value: lastName },
          ],
        },
        // Strategy 3: Partial first name match
        {
          filters: [
            { propertyName: 'firstname', operator: 'CONTAINS_TOKEN', value: firstName.slice(0, 4) },
            { propertyName: 'lastname', operator: 'EQ', value: lastName },
          ],
        },
      ].filter(Boolean);

      for (const strategy of strategies) {
        const payload = {
          filterGroups: [strategy],
          properties: CONSTANTS.HUBSPOT.CONTACT_PROPERTIES,
          limit: 10,
        };

        const response = await client.post('/crm/v3/objects/contacts/search', payload);
        const results = response.data.results || [];

        if (results.length > 0) {
          // If we have company info, prefer matches with matching company
          if (company) {
            for (const result of results) {
              const resultCompany = result.properties.company || '';
              if (
                company.toLowerCase().includes(resultCompany.toLowerCase()) ||
                resultCompany.toLowerCase().includes(company.toLowerCase())
              ) {
                return {
                  ...result.properties,
                  id: result.id,
                };
              }
            }
          }

          // Return first match
          const contact = results[0];
          return {
            ...contact.properties,
            id: contact.id,
          };
        }
      }

      return null;
    } catch (error) {
      logger.error(`Error searching HubSpot contact for ${name}:`, error);
      return null;
    }
  }

  async findContact(attendee: Attendee): Promise<HubSpotContact | null> {
    // First try email search if email is provided
    if (attendee.email) {
      const emailResults = await this.fetchContactsByEmail([attendee.email]);
      if (emailResults.length > 0) {
        return emailResults[0];
      }
    }

    // If no email match, try name search
    if (attendee.name) {
      const nameResult = await this.searchContactByName(attendee.name, attendee.company);
      if (nameResult) {
        return nameResult;
      }
    }

    return null;
  }

  async createContact(attendee: Attendee): Promise<HubSpotContact | null> {
    const client = this.ensureClient();

    try {
      // Check if contact already exists
      const existing = await this.findContact(attendee);
      if (existing) {
        logger.info(`Contact already exists for ${attendee.name || attendee.email}`);
        return existing;
      }

      // Parse name
      const nameParts = attendee.name ? attendee.name.trim().split(/\s+/) : [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Prepare contact properties
      const properties: Record<string, any> = {
        email: attendee.email,
        firstname: firstName,
        lastname: lastName,
        jobtitle: attendee.title,
        company: attendee.company,
        lifecyclestage: 'lead',
      };

      // Add LinkedIn URL if provided
      if (attendee.linkedinUrl) {
        properties.linkedin_url = attendee.linkedinUrl;
      }

      // Remove undefined values
      Object.keys(properties).forEach(key => {
        if (properties[key] === undefined) {
          delete properties[key];
        }
      });

      const response = await client.post('/crm/v3/objects/contacts', { properties });
      
      logger.info(`Created new HubSpot contact for ${attendee.name || attendee.email}`);
      
      return {
        ...response.data.properties,
        id: response.data.id,
      };
    } catch (error: any) {
      if (error.response?.status === 409) {
        logger.info(`Contact already exists (409) for ${attendee.name || attendee.email}`);
        // Try to fetch the existing contact
        return await this.findContact(attendee);
      }
      logger.error(`Error creating HubSpot contact:`, error);
      return null;
    }
  }

  async updateContact(contactId: string, properties: Partial<HubSpotContact>): Promise<boolean> {
    const client = this.ensureClient();

    try {
      // Remove id from properties if present
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...updateProperties } = properties;

      await client.patch(`/crm/v3/objects/contacts/${contactId}`, {
        properties: updateProperties,
      });

      logger.info(`Updated HubSpot contact ${contactId}`);
      return true;
    } catch (error) {
      logger.error(`Error updating HubSpot contact ${contactId}:`, error);
      return false;
    }
  }

  async getContact(contactId: string): Promise<HubSpotContact | null> {
    const client = this.ensureClient();

    try {
      const response = await client.get(`/crm/v3/objects/contacts/${contactId}`, {
        params: {
          properties: CONSTANTS.HUBSPOT.CONTACT_PROPERTIES.join(','),
        },
      });

      return {
        ...response.data.properties,
        id: response.data.id,
      };
    } catch (error) {
      logger.error(`Error fetching HubSpot contact ${contactId}:`, error);
      return null;
    }
  }

  async searchDeals(query: string): Promise<any[]> {
    const client = this.ensureClient();

    try {
      const response = await client.post('/crm/v3/objects/deals/search', {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'dealname',
                operator: 'CONTAINS_TOKEN',
                value: query,
              },
            ],
          },
        ],
        properties: ['dealname', 'amount', 'dealstage', 'closedate', 'hs_object_id'],
        limit: 10,
      });

      return response.data.results || [];
    } catch (error) {
      logger.error(`Error searching HubSpot deals:`, error);
      return [];
    }
  }

  /**
   * Search for companies by domain or name
   */
  async searchCompanies(query: string): Promise<HubSpotCompany[]> {
    const client = this.ensureClient();
    
    try {
      const response = await client.post('/crm/v3/objects/companies/search', {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'domain',
                operator: 'CONTAINS_TOKEN',
                value: query,
              },
            ],
          },
          {
            filters: [
              {
                propertyName: 'name',
                operator: 'CONTAINS_TOKEN',
                value: query,
              },
            ],
          },
        ],
        properties: CONSTANTS.HUBSPOT.COMPANY_PROPERTIES,
        limit: 20,
      });

      return response.data.results?.map((result: any) => ({
        ...result.properties,
        id: result.id,
      })) || [];
    } catch (error) {
      logger.error(`Error searching HubSpot companies for "${query}":`, error);
      return [];
    }
  }

  /**
   * Get company by ID
   */
  async getCompany(companyId: string): Promise<HubSpotCompany | null> {
    const client = this.ensureClient();

    try {
      const response = await client.get(`/crm/v3/objects/companies/${companyId}`, {
        params: {
          properties: CONSTANTS.HUBSPOT.COMPANY_PROPERTIES.join(','),
        },
      });

      return {
        ...response.data.properties,
        id: response.data.id,
      };
    } catch (error) {
      logger.error(`Error fetching HubSpot company ${companyId}:`, error);
      return null;
    }
  }

  /**
   * Find contacts associated with a company
   */
  async getContactsByCompany(companyName: string, domain?: string): Promise<HubSpotContact[]> {
    const client = this.ensureClient();
    const results: HubSpotContact[] = [];

    try {
      // Search by company name
      if (companyName) {
        const response = await client.post('/crm/v3/objects/contacts/search', {
          filterGroups: [{
            filters: [{
              propertyName: 'company',
              operator: 'CONTAINS_TOKEN',
              value: companyName,
            }],
          }],
          properties: CONSTANTS.HUBSPOT.CONTACT_PROPERTIES,
          limit: 50,
        });

        if (response.data.results) {
          results.push(...response.data.results.map((result: any) => ({
            ...result.properties,
            id: result.id,
          })));
        }
      }

      // Also search by email domain if provided
      if (domain) {
        const response = await client.post('/crm/v3/objects/contacts/search', {
          filterGroups: [{
            filters: [{
              propertyName: 'email',
              operator: 'CONTAINS_TOKEN',
              value: `@${domain}`,
            }],
          }],
          properties: CONSTANTS.HUBSPOT.CONTACT_PROPERTIES,
          limit: 50,
        });

        if (response.data.results) {
          const domainContacts = response.data.results.map((result: any) => ({
            ...result.properties,
            id: result.id,
          }));
          
          // Merge results, avoiding duplicates
          for (const contact of domainContacts) {
            if (!results.some(existing => existing.id === contact.id)) {
              results.push(contact);
            }
          }
        }
      }

      logger.info(`Found ${results.length} contacts for company "${companyName}"`);
      return results;
    } catch (error) {
      logger.error(`Error fetching contacts for company "${companyName}":`, error);
      return [];
    }
  }

  /**
   * Get comprehensive company insights
   */
  async getCompanyInsights(companyName: string, domain?: string): Promise<CompanyInsight | null> {
    try {
      // First, find the company
      const companies = await this.searchCompanies(companyName);
      let targetCompany = companies.find(c => 
        c.name?.toLowerCase().includes(companyName.toLowerCase()) ||
        (domain && c.domain?.toLowerCase().includes(domain.toLowerCase()))
      );

      if (!targetCompany && companies.length > 0) {
        targetCompany = companies[0]; // Take the first match
      }

      if (!targetCompany) {
        logger.warn(`No HubSpot company found for "${companyName}"`);
        return null;
      }

      // Get all contacts for this company
      const allContacts = await this.getContactsByCompany(companyName, domain);

      // Find key stakeholders (people with C-level, VP, or Director titles)
      const keyStakeholders = allContacts.filter(contact => {
        const title = (contact.jobtitle || '').toLowerCase();
        return title.includes('ceo') || 
               title.includes('cto') || 
               title.includes('cfo') ||
               title.includes('president') ||
               title.includes('vp') ||
               title.includes('vice president') ||
               title.includes('director') ||
               title.includes('head of') ||
               title.includes('chief');
      });

      // Get recent deals
      const recentDeals = await this.searchDeals(companyName);

      const insight: CompanyInsight = {
        company: targetCompany,
        relatedContacts: allContacts.slice(0, 20), // Limit to top 20
        totalContacts: allContacts.length,
        recentDeals: recentDeals.slice(0, 10), // Limit to top 10
        keyStakeholders
      };

      logger.info(`Generated company insights for "${companyName}": ${allContacts.length} contacts, ${keyStakeholders.length} stakeholders, ${recentDeals.length} deals`);
      
      return insight;
    } catch (error) {
      logger.error(`Error generating company insights for "${companyName}":`, error);
      return null;
    }
  }

  /**
   * Extract company domain from email
   */
  extractDomainFromEmail(email: string): string | null {
    const match = email.match(/@([^.]+\.[^.]+)$/);
    return match ? match[1].toLowerCase() : null;
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Get related companies for attendees
   */
  async getRelatedCompanies(attendeeEmails: string[]): Promise<Map<string, CompanyInsight>> {
    const companyInsights = new Map<string, CompanyInsight>();
    const processedDomains = new Set<string>();

    for (const email of attendeeEmails) {
      const domain = this.extractDomainFromEmail(email);
      if (!domain || processedDomains.has(domain)) continue;
      
      processedDomains.add(domain);

      // Skip common email providers
      if (['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'].includes(domain)) {
        continue;
      }

      try {
        // Try to find company by domain
        const companies = await this.searchCompanies(domain);
        if (companies.length > 0) {
          const companyName = companies[0].name || domain;
          const insight = await this.getCompanyInsights(companyName, domain);
          
          if (insight) {
            companyInsights.set(domain, insight);
          }
        }
      } catch (error) {
        logger.error(`Error processing domain ${domain}:`, error);
      }
    }

    return companyInsights;
  }
}

export default new HubSpotService();