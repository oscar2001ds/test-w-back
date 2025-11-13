import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { registerAs } from '@nestjs/config';

export default registerAs(
  'cors',
  (): CorsOptions => ({
    origin: [
      process.env.CDN_DOMAIN ?? '',
      `https://${process.env.SERVER_PREFIX}.${process.env.ROOT_DOMAIN}`,
      `https://${process.env.ROOT_DOMAIN}`,
      `https://${process.env.APP_PREFIX}.${process.env.ROOT_DOMAIN}`,
      `https://${process.env.CONSOLE_PREFIX}.${process.env.ROOT_DOMAIN}`,
      'http://localhost:3000',
      'https://saporous-leonie-intangily.ngrok-free.dev',
    ],
    credentials: true,
  }),
);
