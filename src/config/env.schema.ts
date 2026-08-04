import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  BASE_URL: z.string().url().default('http://localhost:3000'),
  API_PREFIX: z.string().default('api/v1'),

  DATABASE_URL: z.string(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_NAME: z.string().default('urlshortener'),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().default('redispassword'),
  REDIS_URL: z.string().default('redis://:redispassword@localhost:6379'),

  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  IP_HASH_SALT: z.string().min(8).default('url_shortener_ip_salt'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:\n', JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Environment configuration validation failed');
  }
  return parsed.data;
}