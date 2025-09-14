import axios, { AxiosInstance } from 'axios';
import {
  ApiResponse,
  BDMeetingRequest,
  BDMeetingFormData,
  Attendee,
  UsageLog,
  BDReportData,
  BDResearchData,
  HubSpotCompany,
  CompanyInsight,
  ResearchReport,
  SavedReport,
  ReportSummary,
} from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    // Use different base URLs for development and production
    const baseURL = import.meta.env.DEV
      ? '/api' // Use relative path to leverage Vite proxy in development
      : 'https://meetingprepv3-production.up.railway.app/api'; // Direct URL for production

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds for AI operations
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add any auth headers here if needed
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response) {
          // Server responded with error
          const errorMessage =
            error.response.data?.message || error.response.data?.error || 'Server error occurred';
          throw new Error(errorMessage);
        } else if (error.request) {
          // No response received
          throw new Error('No response from server. Please check if the server is running.');
        } else {
          // Request setup error
          throw new Error('Request failed: ' + error.message);
        }
      }
    );
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.client.get('/health');
  }

  // BD operations
  async researchSingleAttendee(company: string, attendee: Attendee): Promise<ApiResponse<{ attendee: any; company: string }>> {
    return this.client.post('/bd/research-attendee', { company, attendee });
  }

  async researchAttendees(request: BDMeetingRequest): Promise<ApiResponse<BDResearchData>> {
    return this.client.post('/bd/research-attendees', request);
  }

  async generateBDReport(request: BDMeetingRequest): Promise<ApiResponse<BDReportData>> {
    // Generate report can take longer due to multiple API calls
    return this.client.post('/bd/generate', request, {
      timeout: 180000, // 3 minutes for report generation
    });
  }

  async generateBDPrep(formData: BDMeetingFormData): Promise<ApiResponse<BDReportData>> {
    // Transform the form data to match API expectations
    const apiRequest: BDMeetingRequest = {
      company: formData.company,
      attendees: formData.attendees.map(
        ({
          id: _id,
          researchStatus: _researchStatus,
          hubspotStatus: _hubspotStatus,
          ...attendee
        }) => attendee
      ),
      purpose: formData.purpose,
      additionalContext: formData.additionalContext,
    };
    return this.client.post('/bd/generate', apiRequest, {
      timeout: 180000, // 3 minutes for report generation
    });
  }

  async addToHubSpot(attendees: Attendee[]): Promise<ApiResponse> {
    return this.client.post('/bd/add-to-hubspot', { attendees });
  }

  // Debug operations
  async getUsageLogs(limit?: number, offset?: number): Promise<ApiResponse<{ logs: UsageLog[] }>> {
    return this.client.get('/usage-logs', { params: { limit, offset } });
  }

  async testOpenAI(): Promise<ApiResponse> {
    return this.client.get('/debug/openai-test');
  }

  async previewPrompt(type: string, context: Record<string, unknown>): Promise<ApiResponse> {
    return this.client.post('/debug/prompt-preview', { type, context });
  }

  // Customer Research operations
  async searchCompanies(query: string): Promise<ApiResponse<HubSpotCompany[]>> {
    return this.client.get('/research/companies/search', {
      params: { query },
    });
  }

  async getCompanyDetails(companyId: string): Promise<ApiResponse<HubSpotCompany>> {
    return this.client.get(`/research/companies/${companyId}`);
  }

  async getCompanyInsights(companyId: string): Promise<ApiResponse<CompanyInsight>> {
    return this.client.get(`/research/companies/${companyId}/insights`);
  }

  async generateResearch(companyId: string, prompt: string): Promise<ApiResponse<ResearchReport>> {
    return this.client.post(
      '/research/generate',
      {
        companyId,
        prompt,
      },
      {
        timeout: 180000, // 3 minutes for research generation
      }
    );
  }

  async getResearchPrompt(): Promise<ApiResponse<{ prompt: string }>> {
    return this.client.get('/research/prompts');
  }

  async updateResearchPrompt(prompt: string): Promise<ApiResponse<{ prompt: string }>> {
    return this.client.put('/research/prompts', { prompt });
  }

  async resetResearchPrompt(): Promise<ApiResponse<{ prompt: string }>> {
    return this.client.post('/research/prompts/reset');
  }

  // Company Research operations
  async researchCompany(domain: string, companyName?: string): Promise<ApiResponse<{
    hubspot: HubSpotCompany | null;
    pdl: any | null;
    source: string;
    domain: string;
    searchQuery: string;
  }>> {
    return this.client.post('/research/companies/research', {
      domain,
      companyName,
    });
  }

  async addCompanyToHubSpot(companyData: {
    name: string;
    domain?: string;
    industry?: string;
    description?: string;
    website?: string;
    numberofemployees?: string;
    city?: string;
    state?: string;
    country?: string;
    founded_year?: string;
  }): Promise<ApiResponse<HubSpotCompany>> {
    return this.client.post('/research/companies/add-to-hubspot', companyData);
  }

  // Report management
  async listReports(company?: string): Promise<ApiResponse<ReportSummary[]>> {
    const params = company ? { company } : {};
    return this.client.get('/reports', { params });
  }

  async getReport(reportId: string): Promise<ApiResponse<SavedReport>> {
    return this.client.get(`/reports/${reportId}`);
  }

  async deleteReport(reportId: string): Promise<ApiResponse<{ message: string }>> {
    return this.client.delete(`/reports/${reportId}`);
  }
}

export default new ApiService();
