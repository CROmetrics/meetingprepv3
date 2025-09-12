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
} from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api', // Use relative path to leverage Vite proxy
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
      params: { query }
    });
  }

  async getCompanyDetails(companyId: string): Promise<ApiResponse<HubSpotCompany>> {
    return this.client.get(`/research/companies/${companyId}`);
  }

  async getCompanyInsights(companyId: string): Promise<ApiResponse<CompanyInsight>> {
    return this.client.get(`/research/companies/${companyId}/insights`);
  }

  async generateResearch(companyId: string, prompt: string): Promise<ApiResponse<ResearchReport>> {
    return this.client.post('/research/generate', {
      companyId,
      prompt
    }, {
      timeout: 180000, // 3 minutes for research generation
    });
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
}

export default new ApiService();
