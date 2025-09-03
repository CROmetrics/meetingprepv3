import { Request, Response } from 'express';
import slackService from '../services/slack.service';
import { asyncHandler } from '../middleware/error.middleware';
import { logUsage } from '../utils/logger';

export const listChannels = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 200;

  // Log usage
  logUsage('list_channels', { limit }, req.ip);

  const channels = await slackService.listChannels(limit);

  res.json({
    success: true,
    data: {
      channels,
      count: channels.length,
    },
  });
});

export const getChannelMessages = asyncHandler(async (req: Request, res: Response) => {
  const { channelId } = req.params;
  const {
    lookbackDays = 14,
    maxMessages = 300,
    resolveNames = true,
    expandThreads = true,
  } = req.query;

  // Log usage
  logUsage('get_channel_messages', { 
    channelId, 
    lookbackDays, 
    maxMessages 
  }, req.ip);

  const context = await slackService.fetchChannelContext(channelId, {
    lookbackDays: Number(lookbackDays),
    maxMessages: Number(maxMessages),
    resolveNames: resolveNames === 'true',
    expandThreads: expandThreads === 'true',
  });

  const formattedContext = slackService.formatContextAsText(context);

  res.json({
    success: true,
    data: {
      context: formattedContext,
      metadata: {
        channel: context.channel,
        lookbackDays: context.lookbackDays,
        totalMessages: context.totalMessages,
        includedMessages: context.messages.length,
      },
    },
  });
});