import { WebClient } from '@slack/web-api';
import config from '../config/env';
import { CONSTANTS } from '../config/constants';
import logger from '../utils/logger';
import { SlackChannel, SlackMessage, SlackContext } from '../types/meeting.types';

class SlackService {
  private client: WebClient | null = null;
  private userCache: Map<string, string> = new Map();

  constructor() {
    if (config.SLACK_TOKEN) {
      this.client = new WebClient(config.SLACK_TOKEN);
      logger.info('Slack service initialized');
    } else {
      logger.warn('Slack token not configured');
    }
  }

  private ensureClient(): WebClient {
    if (!this.client) {
      throw new Error('Slack client not initialized. Please configure SLACK_TOKEN.');
    }
    return this.client;
  }

  async listChannels(limit: number = 200): Promise<SlackChannel[]> {
    const client = this.ensureClient();
    const channels: SlackChannel[] = [];
    let cursor: string | undefined;

    try {
      for (let i = 0; i < 5; i++) {
        const result = await client.conversations.list({
          exclude_archived: true,
          limit: Math.min(limit, 1000),
          types: CONSTANTS.SLACK.CHANNEL_TYPES,
          cursor,
        });

        if (result.channels) {
          channels.push(...(result.channels as SlackChannel[]));
        }

        cursor = result.response_metadata?.next_cursor;
        if (!cursor || channels.length >= limit) {
          break;
        }
      }

      // Filter channels based on prefix (if any prefixes are defined)
      const filteredChannels = CONSTANTS.SLACK.CHANNEL_FILTER_PREFIXES.length > 0 
        ? channels.filter(channel => 
            CONSTANTS.SLACK.CHANNEL_FILTER_PREFIXES.some(prefix => 
              channel.name.startsWith(prefix)
            )
          )
        : channels; // Return all channels if no filter prefixes

      logger.info(`Listed ${filteredChannels.length} Slack channels`);
      return filteredChannels;
    } catch (error) {
      logger.error('Error listing Slack channels:', error);
      throw new Error('Failed to list Slack channels');
    }
  }

  async getUserName(userId: string): Promise<string> {
    // Check cache first
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId)!;
    }

    const client = this.ensureClient();

    try {
      const result = await client.users.info({ user: userId });
      const user = result.user;
      
      let name = userId;
      if (user) {
        name = user.profile?.display_name || user.real_name || userId;
      }

      // Cache the result
      this.userCache.set(userId, name);
      return name;
    } catch (error) {
      logger.error(`Error fetching user info for ${userId}:`, error);
      return userId;
    }
  }

  async fetchChannelContext(
    channelId: string,
    options: {
      lookbackDays?: number;
      maxMessages?: number;
      resolveNames?: boolean;
      expandThreads?: boolean;
    } = {}
  ): Promise<SlackContext> {
    const {
      lookbackDays = CONSTANTS.SLACK.DEFAULT_LOOKBACK_DAYS,
      maxMessages = CONSTANTS.SLACK.MAX_MESSAGES,
      resolveNames = true,
      expandThreads = true,
    } = options;

    const client = this.ensureClient();
    const messages: SlackMessage[] = [];
    
    // Calculate oldest timestamp
    const oldest = Math.floor(
      (Date.now() - lookbackDays * 24 * 60 * 60 * 1000) / 1000
    );

    try {
      // First check if we can get channel info (to see if we're already in it)
      try {
        const info = await client.conversations.info({ channel: channelId });
        logger.info(`Channel ${channelId} info: is_member=${info.channel?.is_member}, is_channel=${info.channel?.is_channel}, is_private=${info.channel?.is_private}`);
        
        // If we're not a member and it's a public channel, try to join
        if (!info.channel?.is_member && info.channel?.is_channel && !info.channel?.is_private) {
          try {
            await client.conversations.join({ channel: channelId });
            logger.info(`Successfully joined channel ${channelId}`);
          } catch (joinError: any) {
            logger.warn(`Could not join channel ${channelId}: ${joinError?.data?.error || joinError?.message || joinError}`);
            
            if (joinError?.data?.error === 'missing_scope') {
              throw new Error('The Slack bot needs the "channels:join" scope to automatically join public channels. Please either: 1) Add the bot to the channel manually via Slack, or 2) Update the bot\'s OAuth scopes to include "channels:join".');
            }
          }
        }
      } catch (infoError: any) {
        logger.warn(`Could not get channel info for ${channelId}: ${infoError?.data?.error || infoError?.message}`);
        // Continue anyway - the history call will fail if we don't have access
      }

      let cursor: string | undefined;
      
      // Fetch messages with pagination
      for (let i = 0; i < 10; i++) {
        const result = await client.conversations.history({
          channel: channelId,
          oldest: oldest.toString(),
          limit: 200,
          inclusive: true,
          cursor,
        });

        if (result.messages) {
          messages.push(...(result.messages as SlackMessage[]));
        }

        cursor = result.response_metadata?.next_cursor;
        if (!cursor || messages.length >= maxMessages) {
          break;
        }
      }

      // Expand threads if requested
      if (expandThreads) {
        const threadParents = messages
          .filter(m => m.thread_ts && m.ts === m.thread_ts)
          .sort((a, b) => parseFloat(b.ts) - parseFloat(a.ts))
          .slice(0, CONSTANTS.SLACK.MAX_THREAD_EXPANSIONS);

        for (const parent of threadParents) {
          try {
            const result = await client.conversations.replies({
              channel: channelId,
              ts: parent.ts,
              limit: 100,
            });

            if (result.messages && result.messages.length > 1) {
              // Skip the parent (first message) and add replies
              parent.replies = result.messages.slice(1) as SlackMessage[];
            }
          } catch (error) {
            logger.error(`Error fetching thread replies for ${parent.ts}:`, error);
          }
        }
      }

      // Resolve user names if requested
      if (resolveNames) {
        for (const message of messages) {
          if (message.user) {
            message._userName = await this.getUserName(message.user);
          }
          if (message.replies) {
            for (const reply of message.replies) {
              if (reply.user) {
                reply._userName = await this.getUserName(reply.user);
              }
            }
          }
        }
      }

      // Sort messages by timestamp
      const sortedMessages = messages.sort((a, b) => 
        parseFloat(a.ts) - parseFloat(b.ts)
      );

      logger.info(`Fetched ${sortedMessages.length} messages from channel ${channelId}`);

      return {
        channel: channelId,
        messages: sortedMessages.slice(0, maxMessages),
        lookbackDays,
        totalMessages: sortedMessages.length,
      };
    } catch (error: any) {
      logger.error(`Error fetching channel context for ${channelId}:`, error);
      
      // Provide more specific error messages
      if (error?.data?.error === 'not_in_channel') {
        throw new Error('The Slack bot is not a member of this channel. To fix this:\n\n1. Go to the channel in Slack\n2. Type /invite @[your-bot-name]\n3. Try again\n\nNote: The bot needs to be manually added to channels for security reasons.');
      } else if (error?.data?.error === 'channel_not_found') {
        throw new Error('Channel not found. Please select a valid channel.');
      } else if (error?.data?.error === 'invalid_auth') {
        throw new Error('Slack authentication failed. Please check your Slack token configuration.');
      }
      
      throw new Error('Failed to fetch channel context: ' + (error?.message || 'Unknown error'));
    }
  }

  formatContextAsText(context: SlackContext): string {
    const lines: string[] = [];
    let count = 0;
    const maxMessages = CONSTANTS.SLACK.MAX_MESSAGES;

    for (const message of context.messages) {
      if (count >= maxMessages) break;

      const timestamp = new Date(parseFloat(message.ts) * 1000).toISOString();
      const userName = message._userName || message.user || 'Unknown';
      const text = message.text || '';

      if (text) {
        lines.push(`• [${timestamp}] ${userName}: ${text}`);
        count++;
      }

      // Include thread replies
      if (message.replies) {
        for (const reply of message.replies) {
          if (count >= maxMessages) break;

          const replyTimestamp = new Date(parseFloat(reply.ts) * 1000).toISOString();
          const replyUserName = reply._userName || reply.user || 'Unknown';
          const replyText = reply.text || '';

          if (replyText) {
            lines.push(`    ◦ [${replyTimestamp}] ${replyUserName}: ${replyText}`);
            count++;
          }
        }
      }
    }

    return lines.length > 0 
      ? lines.join('\n')
      : '(no recent Slack messages in window)';
  }
}

export default new SlackService();