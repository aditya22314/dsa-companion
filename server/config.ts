import 'dotenv/config';

export interface ServerConfig {
  port: number;
  host: string;
  appBaseUrl: string;
  dataFile: string;
  google: { clientId?: string; clientSecret?: string; redirectUri: string };
  encryptionKey?: string;
  ai: { apiKey?: string; model: string };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const port = Number(env.PORT ?? 8787);
  const appBaseUrl = (env.APP_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');
  return {
    port,
    host: env.HOST ?? '127.0.0.1',
    appBaseUrl,
    dataFile: env.DATA_FILE ?? 'server/data/store.json',
    google: {
      clientId: env.GOOGLE_CLIENT_ID || undefined,
      clientSecret: env.GOOGLE_CLIENT_SECRET || undefined,
      redirectUri: env.GOOGLE_REDIRECT_URI ?? `http://localhost:${port}/api/google/callback`,
    },
    encryptionKey: env.TOKEN_ENCRYPTION_KEY || undefined,
    ai: { apiKey: env.ANTHROPIC_API_KEY || undefined, model: env.AI_MODEL ?? 'claude-opus-5-5' },
  };
}

export const googleConfigured = (c: ServerConfig) => !!(c.google.clientId && c.google.clientSecret && c.encryptionKey);
export const aiConfigured = (c: ServerConfig) => !!c.ai.apiKey;
