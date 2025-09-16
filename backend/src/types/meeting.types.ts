import { PromptStyle, CustomPrompts } from './bd.types';

export interface MeetingBriefRequest {
  channelId: string;
  lookbackDays?: number;
  maxMessages?: number;
  attendees?: string[];
  purpose?: string;
  accountContext?: string;
  promptStyle?: PromptStyle;
  customPrompts?: CustomPrompts;
}

export interface MeetingBriefResponse {
  brief: string;
  metadata: {
    channelName: string;
    messageCount: number;
    lookbackDays: number;
    generatedAt: string;
  };
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_member?: boolean;
  num_members?: number;
  created?: number;
  creator?: string;
  topic?: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose?: {
    value: string;
    creator: string;
    last_set: number;
  };
}

export interface SlackMessage {
  ts: string;
  user: string;
  text: string;
  thread_ts?: string;
  reply_count?: number;
  replies?: SlackMessage[];
  _userName?: string;
}

export interface SlackContext {
  channel: string;
  messages: SlackMessage[];
  lookbackDays: number;
  totalMessages: number;
}