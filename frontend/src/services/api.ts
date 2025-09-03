import axios, { AxiosInstance } from 'axios';
import { 
  ApiResponse, 
  SlackChannel, 
  MeetingBriefRequest, 
  BDMeetingRequest,
  BDMeetingFormData,
  Attendee,
  UsageLog 
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
          const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error occurred';
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

  // Channel operations
  async listChannels(limit?: number): Promise<ApiResponse<{ channels: SlackChannel[]; count: number }>> {
    return this.client.get('/channels', { params: { limit } });
  }

  async getChannelMessages(
    channelId: string,
    options?: {
      lookbackDays?: number;
      maxMessages?: number;
      resolveNames?: boolean;
      expandThreads?: boolean;
    }
  ): Promise<ApiResponse> {
    return this.client.get(`/channels/${channelId}/messages`, { params: options });
  }

  // Meeting operations
  async generateMeetingBrief(request: MeetingBriefRequest): Promise<ApiResponse> {
    return this.client.post('/run', request);
  }

  // BD operations
  async researchAttendees(request: BDMeetingRequest): Promise<ApiResponse> {
    return this.client.post('/bd/research-attendees', request);
  }

  async generateBDReport(request: BDMeetingRequest): Promise<ApiResponse> {
    return this.client.post('/bd/generate', request);
  }

  async generateBDPrep(formData: BDMeetingFormData): Promise<ApiResponse> {
    // Transform the form data to match API expectations
    const apiRequest: BDMeetingRequest = {
      company: formData.company,
      attendees: [
        {
          name: formData.name,
          email: formData.email,
          title: formData.role,
          company: formData.company
        }
      ],
      purpose: formData.notes || undefined,
      additionalContext: formData.notes || undefined
    };
    return this.client.post('/bd/generate', apiRequest);
  }

  async searchHubspotDeals(query: string): Promise<ApiResponse> {
    return this.client.get('/bd/search-deals', { params: { query } });
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

  async previewPrompt(type: string, context: any): Promise<ApiResponse> {
    return this.client.post('/debug/prompt-preview', { type, context });
  }
}

export default new ApiService();