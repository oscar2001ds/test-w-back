import { Request } from 'express';
import { User } from 'src/user/user/user.entity';

export type ServerRequest = Request & {
  user: { user: User; sessionId?: string };
  localeId?: string;
};

export type ServerRequestLowSecurity = Request & {
  user: { user: User | null; sessionId: string | null };
  localeId?: string;
};
