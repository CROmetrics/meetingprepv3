export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_member?: boolean;
  num_members?: number;
}

export interface MeetingBriefRequest {
  channelId: string;
  lookbackDays?: number;
  maxMessages?: number;
  attendees?: string[];
  purpose?: string;
  accountContext?: string;
}

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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UsageLog {
  timestamp: string;
  eventType: string;
  clientIp: string;
  data: Record<string, any>;
}