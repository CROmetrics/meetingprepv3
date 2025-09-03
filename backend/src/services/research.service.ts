import axios from 'axios';
import * as cheerio from 'cheerio';
import config from '../config/env';
import { CONSTANTS } from '../config/constants';
import logger from '../utils/logger';
import {
  WebSearchResult,
  WebPageContent,
  AttendeeResearch,
  CompanyResearch,
  CompetitiveAnalysis,
} from '../types/bd.types';

class ResearchService {
  private searchCache: Map<string, { results: WebSearchResult[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = CONSTANTS.CACHE.SEARCH_TTL_MS;

  async webSearch(query: string, numResults: number = 10): Promise<WebSearchResult[]> {
    // Check cache
    const cached = this.searchCache.get(query);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      logger.debug(`Using cached search results for: ${query}`);
      return cached.results.slice(0, numResults);
    }

    if (!config.SERPER_API_KEY) {
      logger.warn('Serper API key not configured');
      return [{
        title: 'Web search unavailable',
        snippet: 'SERPER_API_KEY not configured',
        link: '',
      }];
    }

    try {
      const response = await axios.post(
        `${CONSTANTS.SERPER_API_BASE}/search`,
        {
          q: query,
          num: Math.min(numResults, CONSTANTS.RESEARCH.MAX_SEARCH_RESULTS),
        },
        {
          headers: {
            'X-API-KEY': config.SERPER_API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const results: WebSearchResult[] = [];
      for (const item of response.data.organic || []) {
        results.push({
          title: item.title || '',
          snippet: item.snippet || '',
          link: item.link || '',
        });
      }

      // Cache results
      this.searchCache.set(query, { results, timestamp: Date.now() });
      
      logger.info(`Web search completed for: ${query} (${results.length} results)`);
      return results.slice(0, numResults);
    } catch (error) {
      logger.error(`Web search failed for query "${query}":`, error);
      return [{
        title: 'Search failed',
        snippet: error instanceof Error ? error.message : 'Unknown error',
        link: '',
      }];
    }
  }

  async scrapeWebpage(url: string): Promise<WebPageContent> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 30000,
        maxContentLength: 10 * 1024 * 1024, // 10MB max
      });

      const $ = cheerio.load(response.data);

      // Remove script and style elements
      $('script, style, noscript').remove();

      // Get title
      const title = $('title').text() || 'No title';

      // Extract text content
      const text = $('body').text();

      // Clean up text
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
      const cleanedText = lines.join(' ').replace(/\s+/g, ' ').trim();

      // Truncate if too long
      const content = cleanedText.length > CONSTANTS.RESEARCH.MAX_SCRAPE_LENGTH
        ? cleanedText.substring(0, CONSTANTS.RESEARCH.MAX_SCRAPE_LENGTH) + '... [truncated]'
        : cleanedText;

      logger.info(`Scraped webpage: ${url} (${content.length} chars)`);

      return { title, content, url };
    } catch (error) {
      logger.error(`Failed to scrape webpage ${url}:`, error);
      return {
        title: 'Error',
        content: `Failed to fetch content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        url,
      };
    }
  }

  async researchAttendeeLinkedIn(
    name: string,
    company: string,
    title?: string
  ): Promise<{ url?: string; snippet?: string; title?: string }> {
    if (!name || !company) {
      return {};
    }

    const queryParts = [name, company, 'linkedin'];
    if (title) {
      queryParts.splice(2, 0, title);
    }

    const query = queryParts.join(' ');

    try {
      const results = await this.webSearch(query, CONSTANTS.RESEARCH.LINKEDIN_SEARCH_LIMIT);

      // Look for LinkedIn profile URLs
      for (const result of results) {
        if (result.link.includes('linkedin.com/in/')) {
          // Verify it's likely the right person
          const nameParts = name.toLowerCase().split(/\s+/);
          if (nameParts.length >= 2) {
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];

            const titleLower = result.title.toLowerCase();
            const snippetLower = result.snippet.toLowerCase();

            if (
              (titleLower.includes(firstName) || snippetLower.includes(firstName)) &&
              (titleLower.includes(lastName) || snippetLower.includes(lastName))
            ) {
              return {
                url: result.link,
                snippet: result.snippet,
                title: result.title,
              };
            }
          }
        }
      }

      return {};
    } catch (error) {
      logger.error(`LinkedIn research failed for ${name}:`, error);
      return {};
    }
  }

  async researchAttendeeBackground(
    name: string,
    company: string,
    title?: string,
    linkedinUrl?: string
  ): Promise<AttendeeResearch> {
    const research: AttendeeResearch = {
      name,
      company,
      title,
    };

    // Search for LinkedIn if not provided
    if (!linkedinUrl) {
      const linkedinInfo = await this.researchAttendeeLinkedIn(name, company, title);
      research.linkedinUrl = linkedinInfo.url;
      research.linkedinSnippet = linkedinInfo.snippet;
    } else {
      research.linkedinUrl = linkedinUrl;
    }

    // Perform background search
    const backgroundQuery = `${name} ${company} ${title || ''} background experience`;
    const backgroundResults = await this.webSearch(backgroundQuery, 3);
    research.searchResults = backgroundResults;

    logger.info(`Completed background research for ${name}`);
    return research;
  }

  async researchCompany(companyName: string, executiveName?: string): Promise<CompanyResearch> {
    const year = CONSTANTS.CURRENT_YEAR;
    const research: CompanyResearch = {
      overview: [],
      recentNews: [],
      financialInfo: [],
      digitalTransformation: [],
    };

    // Company overview
    const overviewQuery = `${companyName} company overview business model strategy ${year}`;
    research.overview = await this.webSearch(overviewQuery, 5);

    // Recent news
    const newsQuery = `${companyName} news earnings digital transformation ${year}`;
    research.recentNews = await this.webSearch(newsQuery, 5);

    // Financial information
    const financialQuery = `${companyName} annual report earnings financial results ${year}`;
    research.financialInfo = await this.webSearch(financialQuery, 3);

    // Digital transformation
    const digitalQuery = `${companyName} digital transformation data analytics technology strategy`;
    research.digitalTransformation = await this.webSearch(digitalQuery, 4);

    logger.info(`Completed company research for ${companyName}`);
    return research;
  }

  async researchCompetitiveLandscape(
    companyName: string,
    industry?: string
  ): Promise<CompetitiveAnalysis> {
    let query: string;
    if (industry) {
      query = `${industry} digital transformation leaders ${companyName} competitors analysis`;
    } else {
      query = `${companyName} competitors industry leaders digital transformation`;
    }

    const results = await this.webSearch(query, 8);

    logger.info(`Completed competitive landscape research for ${companyName}`);
    return {
      results,
      analysis: `Based on ${results.length} search results for competitive landscape`,
    };
  }

  clearCache(): void {
    this.searchCache.clear();
    logger.info('Research cache cleared');
  }
}

export default new ResearchService();