import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import config from './config/env';
import logger from './utils/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = '0.0.0.0'; // Bind to all interfaces for Railway

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));

// Compression
app.use(compression());

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api', routes);

// Serve static files in production
if (config.NODE_ENV === 'production') {
  // Serve frontend static files
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Handle React Router - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, HOST, () => {
  logger.info(`🚀 Server running on ${HOST}:${PORT}`);
  logger.info(`📁 Logs directory: ${config.LOGS_DIR}`);
  logger.info(`🔧 Environment: ${config.NODE_ENV}`);
  logger.info(`🤖 OpenAI Model: ${config.OPENAI_MODEL}`);
  logger.info(`📊 Structured Output: ${config.STRUCTURED_OUTPUT ? 'Enabled' : 'Disabled'}`);
  logger.info(`🔄 Self-Critique: ${config.SELF_CRITIQUE ? 'Enabled' : 'Disabled'}`);
  
  // Check service configurations
  if (!config.SLACK_TOKEN) {
    logger.warn('⚠️  Slack token not configured - Slack features disabled');
  }
  if (!config.HUBSPOT_TOKEN) {
    logger.warn('⚠️  HubSpot token not configured - HubSpot features disabled');
  }
  if (!config.SERPER_API_KEY) {
    logger.warn('⚠️  Serper API key not configured - Web search disabled');
  }
});