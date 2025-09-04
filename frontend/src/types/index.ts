export interface Attendee {
  name: string;
  email?: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
}

export interface BDMeetingRequest {
  company: string;
  attendees: Attendee[];
  purpose?: string;
  additionalContext?: string;
}

export interface AttendeeWithStatus extends Attendee {
  id: string;
  researchStatus: 'pending' | 'researching' | 'completed' | 'error';
  hubspotStatus?: 'not_found' | 'found' | 'added';
}

export interface BDMeetingFormData {
  company: string;
  purpose?: string;
  additionalContext?: string;
  attendees: AttendeeWithStatus[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UsageLog {
  timestamp: string;
  eventType: string;
  clientIp: string;
  data: Record<string, unknown>;
}
