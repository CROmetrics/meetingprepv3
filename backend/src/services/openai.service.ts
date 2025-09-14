import OpenAI from 'openai';
import config from '../config/env';
import logger from '../utils/logger';
import { PROMPTS } from './prompts';
import { IntelligenceReport } from '../types/bd.types';
import { ToolResult } from '../types/api.types';
import researchService from './research.service';
import hubspotService from './hubspot.service';

class OpenAIService {
  private client: OpenAI | null = null;

  constructor() {
    if (config.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
      });
      logger.info('OpenAI service initialized');
    } else {
      logger.warn('OpenAI API key not configured');
    }
  }

  private ensureClient(): OpenAI {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please configure OPENAI_API_KEY.');
    }
    return this.client;
  }

  async generateInternalMeetingBrief(
    slackContext: string,
    attendees: string[],
    purpose?: string,
    accountContext?: string
  ): Promise<string> {
    const client = this.ensureClient();

    try {
      // Build the user prompt
      let userPrompt = PROMPTS.INTERNAL_MEETING.USER;
      userPrompt += '\n\n**ATTENDEES:**\n';
      userPrompt += attendees.length > 0 ? attendees.join(', ') : 'Not specified';
      
      if (purpose) {
        userPrompt += `\n\n**MEETING PURPOSE:**\n${purpose}`;
      }
      
      if (accountContext) {
        userPrompt += `\n\n**ACCOUNT CONTEXT:**\n${accountContext}`;
      }
      
      userPrompt += `\n\n**RECENT SLACK ACTIVITY:**\n${slackContext}`;

      const response = await client.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages: [
          { role: 'system', content: PROMPTS.INTERNAL_MEETING.SYSTEM },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const brief = response.choices[0]?.message?.content || 'Failed to generate brief';

      // Apply critique if enabled
      if (config.SELF_CRITIQUE) {
        return await this.applyCritique(brief, 'internal');
      }

      logger.info('Generated internal meeting brief');
      return brief;
    } catch (error) {
      logger.error('Error generating internal meeting brief:', error);
      throw new Error('Failed to generate meeting brief');
    }
  }

  async generateBDIntelligenceReport(
    researchContext: string,
    tools: boolean = true
  ): Promise<IntelligenceReport | string> {
    const client = this.ensureClient();

    try {
      let userPrompt = PROMPTS.BD_MEETING.USER;
      userPrompt += `\n\n**RESEARCH CONTEXT:**\n${researchContext}`;

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: PROMPTS.BD_MEETING.SYSTEM },
        { role: 'user', content: userPrompt },
      ];

      // If tools are enabled, define available functions
      const toolDefinitions = tools ? this.getBDToolDefinitions() : undefined;

      const response = await client.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 3000,
        tools: toolDefinitions,
        tool_choice: tools ? 'auto' : undefined,
      });

      // Handle tool calls if present
      if (response.choices[0]?.message?.tool_calls) {
        const toolResults = await this.executeToolCalls(response.choices[0].message.tool_calls);
        
        // Add tool results to conversation and get final response
        messages.push(response.choices[0].message);
        
        for (const result of toolResults) {
          messages.push({
            role: 'tool',
            content: JSON.stringify(result.result),
            tool_call_id: result.id,
          });
        }

        const finalResponse = await client.chat.completions.create({
          model: config.OPENAI_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 3000,
        });

        const report = finalResponse.choices[0]?.message?.content || 'Failed to generate report';

        // Apply critique if enabled
        if (config.SELF_CRITIQUE) {
          return await this.applyCritique(report, 'bd');
        }

        return report;
      }

      const report = response.choices[0]?.message?.content || 'Failed to generate report';

      // Try to parse as JSON first
      try {
        const parsedReport = JSON.parse(report);
        if (this.isValidIntelligenceReport(parsedReport)) {
          logger.info('Generated structured BD intelligence report');
          return parsedReport;
        } else {
          logger.warn('AI returned invalid JSON structure, falling back to string parsing');
        }
      } catch (parseError) {
        logger.warn('AI response was not valid JSON, treating as string');
      }

      // Apply critique if enabled and fallback to string
      if (config.SELF_CRITIQUE) {
        return await this.applyCritique(report, 'bd');
      }

      logger.info('Generated BD intelligence report (string format)');
      return report;
    } catch (error) {
      logger.error('Error generating BD intelligence report:', error);
      throw new Error('Failed to generate intelligence report');
    }
  }

  private isValidIntelligenceReport(obj: any): boolean {
    const requiredFields = [
      'executiveSummary',
      'targetCompanyIntelligence',
      'meetingAttendeeAnalysis',
      'strategicOpportunityAssessment',
      'meetingDynamicsStrategy',
      'keyQuestions',
      'potentialObjectionsResponses'
    ];

    return requiredFields.every(field =>
      obj.hasOwnProperty(field) &&
      obj[field] !== null &&
      obj[field] !== undefined &&
      obj[field].toString().trim().length > 0
    );
  }

  private async applyCritique(
    originalReport: string,
    type: 'internal' | 'bd'
  ): Promise<string> {
    const client = this.ensureClient();

    try {
      const critiquePrompt = `${PROMPTS.CRITIQUE.USER}\n\n**ORIGINAL REPORT:**\n${originalReport}`;

      const response = await client.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages: [
          { role: 'system', content: PROMPTS.CRITIQUE.SYSTEM },
          { role: 'user', content: critiquePrompt },
        ],
        temperature: 0.5,
        max_tokens: 3000,
      });

      const improvedReport = response.choices[0]?.message?.content || originalReport;
      logger.info(`Applied critique to ${type} report`);
      return improvedReport;
    } catch (error) {
      logger.error('Error applying critique:', error);
      return originalReport; // Return original if critique fails
    }
  }

  private getBDToolDefinitions(): OpenAI.Chat.ChatCompletionTool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'search_web',
          description: 'Search the web for a given query and return top results',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'The search query' },
              num_results: { 
                type: 'integer', 
                minimum: 1, 
                maximum: 10, 
                description: 'Number of results to return' 
              },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'scrape_webpage',
          description: 'Fetch and extract readable text content from a URL',
          parameters: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'The URL to scrape' },
            },
            required: ['url'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'lookup_hubspot_contact',
          description: 'Look up a HubSpot contact by name and optional company',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Full name of the contact' },
              company: { type: 'string', description: 'Company name' },
            },
            required: ['name'],
          },
        },
      },
    ];
  }

  private async executeToolCalls(
    toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[]
  ): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      try {
        // Type guard to check if it's a function tool call
        if (toolCall.type === 'function') {
          const args = JSON.parse(toolCall.function.arguments);
          let result: any;

          switch (toolCall.function.name) {
            case 'search_web':
              result = await researchService.webSearch(
                args.query,
                args.num_results || 5
              );
              break;

            case 'scrape_webpage':
              result = await researchService.scrapeWebpage(args.url);
              break;

            case 'lookup_hubspot_contact':
              result = await hubspotService.searchContactByName(
                args.name,
                args.company
              );
              break;

            default:
              result = { error: `Unknown tool: ${toolCall.function.name}` };
          }

          results.push({
            id: toolCall.id,
            result,
          });

          logger.info(`Executed tool call: ${toolCall.function.name}`);
        }
      } catch (error) {
        logger.error(`Error executing tool:`, error);
        results.push({
          id: toolCall.id,
          result: { error: error instanceof Error ? error.message : 'Tool execution failed' },
        });
      }
    }

    return results;
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const client = this.ensureClient();
      
      const response = await client.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content received from OpenAI');
      }

      return content.trim();
    } catch (error) {
      logger.error('Error generating response:', error);
      throw new Error('Failed to generate response');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = this.ensureClient();
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      });
      return !!response.choices[0]?.message;
    } catch (error) {
      logger.error('OpenAI connection test failed:', error);
      return false;
    }
  }
}

export default new OpenAIService();