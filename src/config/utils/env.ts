/* eslint-disable @typescript-eslint/no-namespace */
import { InternalServerErrorException, Logger } from '@nestjs/common';
import ErrorMessages from 'src/common/utils/error-messages';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']),
  SERVER_PORT: z.coerce.number(),
  SERVER_PREFIX: z.string(),
  CONSOLE_PREFIX: z.string(),
  APP_PREFIX: z.string(),
  ROOT_DOMAIN: z.string(),
  DEFAULT_LOCALE: z.string(),

  DB_HOST: z.string(),
  DB_PORT: z.coerce.number(),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string(),
  DB_DATABASE_NAME: z.string(),
  DB_SSL_MODE: z.coerce.boolean(),

  MAIL_EMAIL: z.string().email(),
  MAIL_PASSWORD: z.string(),
  MAIL_FROM: z.string(),

  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string(),

  RECAPTCHA_SECRET_KEY: z.string().optional(),
  DEV_CAPTCHA: z.string().optional(),
});

export default function validateEnvironmentVariables(
  config: Record<string, unknown>,
) {
  const parsedResult = envSchema.safeParse(config);
  const logger = new Logger('environment');
  if (!parsedResult.success) {
    logger.verbose(parsedResult.error);
    throw new InternalServerErrorException(ErrorMessages.ENV_VALIDATION_ERROR);
  }
  return parsedResult.data;
}

type EnvVarSchema = z.infer<typeof envSchema>;

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ProcessEnv extends EnvVarSchema { }
  }
}
