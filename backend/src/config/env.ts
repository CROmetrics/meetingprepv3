import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Try to load from backend/.env first, then fall back to root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const envSchema = z.object({
  // OpenAI Configuration
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  OPENAI_MODEL: z.string().default('gpt-4-turbo-preview'),
  STRUCTURED_OUTPUT: z.enum(['0', '1']).default('0').transform(val => val === '1'),
  SELF_CRITIQUE: z.enum(['0', '1']).default('1').transform(val => val === '1'),

  // Slack Configuration
  SLACK_TOKEN: z.string().optional(),

  // HubSpot Configuration
  HUBSPOT_TOKEN: z.string().optional(),

  // Serper API Configuration
  SERPER_API_KEY: z.string().optional(),

  // Google Calendar API Configuration
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:3001/api/auth/google/callback'),

  // People Data Labs API Configuration
  PEOPLEDATALABS_API_KEY: z.string().optional(),

  // Server Configuration
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Logging Configuration
  LOGS_DIR: z.string().default('/tmp/meeting_brief_logs'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Frontend URL (for CORS)
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
});

export type EnvConfig = z.infer<typeof envSchema>;

let config: EnvConfig;

try {
  config = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    error.errors.forEach((err) => {
      console.error(`  ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export default config;